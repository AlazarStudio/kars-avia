import React, {
  useState, useRef, useCallback, useEffect, useLayoutEffect,
} from "react";
import ReactDOM from "react-dom";
import classes from "./ScriptRunner.module.css";
import { SCRIPT_RUNNER_ID_ATTR } from "../../../utils/scriptRunnerSelectors";

// ─── Utilities ───────────────────────────────────────────────────────────────
function generateSelector(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;
  const runnerTarget = el.closest?.(`[${SCRIPT_RUNNER_ID_ATTR}]`);
  if (runnerTarget) {
    const runnerId = runnerTarget.getAttribute(SCRIPT_RUNNER_ID_ATTR);
    if (runnerId) {
      return `[${SCRIPT_RUNNER_ID_ATTR}="${CSS.escape(runnerId)}"]`;
    }
  }
  if (el.id) return `#${CSS.escape(el.id)}`;
  const parts = [];
  let cur = el;
  while (cur && cur !== document.body && cur.nodeType === Node.ELEMENT_NODE) {
    if (cur.id) { parts.unshift(`#${CSS.escape(cur.id)}`); break; }
    let part = cur.nodeName.toLowerCase();
    const sibs = Array.from(cur.parentNode?.children || []).filter(s => s.nodeName === cur.nodeName);
    if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(cur) + 1})`;
    parts.unshift(part);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const MARKER_HOLD_TO_DRAG_MS = 2000;

const SCRIPT_RUNNER_LIBRARY_TYPE = "script-runner-library";
const SCRIPT_RUNNER_SINGLE_TYPE = "script-runner-script";
const SCRIPT_RUNNER_FOLDER_TYPE = "script-runner-folder";
const SCRIPTS_TREE_STORAGE_KEY = "karsavia_scripts_tree";

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isValidActionItem(action) {
  return isPlainObject(action) && typeof action.type === "string";
}

function isValidActionsArray(actions) {
  return Array.isArray(actions) && actions.every(isValidActionItem);
}

function makeSafeFileName(name, fallback = "script-runner") {
  const safe = String(name ?? "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
  return safe || fallback;
}

// ─── Tree utilities ──────────────────────────────────────────────────────────

let _idCounter = 0;
function generateId() {
  _idCounter += 1;
  return `${Date.now().toString(36)}-${(Math.random() * 0xffffff | 0).toString(36)}-${_idCounter}`;
}

function findNodeById(tree, id) {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.type === "folder" && node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateNodeById(tree, id, updater) {
  return tree.map((node) => {
    if (node.id === id) return updater(node);
    if (node.type === "folder" && node.children) {
      return { ...node, children: updateNodeById(node.children, id, updater) };
    }
    return node;
  });
}

function removeNodeById(tree, id) {
  return tree
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.type === "folder" && node.children) {
        return { ...node, children: removeNodeById(node.children, id) };
      }
      return node;
    });
}

function insertNode(tree, parentId, node) {
  if (parentId == null) return [...tree, node];
  return tree.map((n) => {
    if (n.id === parentId && n.type === "folder") {
      return { ...n, children: [...(n.children || []), node] };
    }
    if (n.type === "folder" && n.children) {
      return { ...n, children: insertNode(n.children, parentId, node) };
    }
    return n;
  });
}

function collectScripts(node) {
  if (node.type === "script") return [node];
  if (node.type === "folder" && node.children) {
    return node.children.flatMap(collectScripts);
  }
  return [];
}

function collectAllScripts(tree) {
  return tree.flatMap(collectScripts);
}

function countScripts(tree) {
  return collectAllScripts(tree).length;
}

function assignIdsToTree(tree) {
  return tree.map((node) => {
    const withId = { ...node, id: node.id || generateId() };
    if (withId.type === "folder" && withId.children) {
      withId.children = assignIdsToTree(withId.children);
    }
    return withId;
  });
}

function isDescendantOf(tree, ancestorId, nodeId) {
  const ancestor = findNodeById(tree, ancestorId);
  if (!ancestor || ancestor.type !== "folder") return false;
  return !!findNodeById(ancestor.children || [], nodeId);
}

function moveNode(tree, nodeId, targetParentId) {
  const node = findNodeById(tree, nodeId);
  if (!node) return tree;
  const without = removeNodeById(tree, nodeId);
  return insertNode(without, targetParentId, node);
}

function insertRelativeToNode(tree, targetId, node, position) {
  const result = [];
  for (const n of tree) {
    if (position === "before" && n.id === targetId) result.push(node);
    if (n.type === "folder" && n.children) {
      result.push({ ...n, children: insertRelativeToNode(n.children, targetId, node, position) });
    } else {
      result.push(n);
    }
    if (position === "after" && n.id === targetId) result.push(node);
  }
  return result;
}

function reorderNode(tree, nodeId, targetId, position) {
  if (nodeId === targetId) return tree;
  const node = findNodeById(tree, nodeId);
  if (!node) return tree;
  const without = removeNodeById(tree, nodeId);
  if (position === "inside") {
    return insertNode(without, targetId, node);
  }
  return insertRelativeToNode(without, targetId, node, position);
}

function migrateFromFlatFormat() {
  const nodes = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("karsavia_script_")) {
      try {
        const actions = JSON.parse(localStorage.getItem(key));
        if (isValidActionsArray(actions)) {
          nodes.push({
            id: generateId(),
            type: "script",
            name: key.replace("karsavia_script_", ""),
            actions,
          });
        }
      } catch { /* skip corrupted */ }
    }
  }
  return nodes;
}

function flatObjectToTree(scripts) {
  return Object.entries(scripts).map(([name, actions]) => ({
    id: generateId(),
    type: "script",
    name,
    actions: isValidActionsArray(actions) ? actions : [],
  }));
}

function isValidTreeNode(node) {
  if (!isPlainObject(node)) return false;
  if (node.type === "script") return typeof node.name === "string";
  if (node.type === "folder") return typeof node.name === "string" && Array.isArray(node.children);
  return false;
}

function isValidTree(tree) {
  return Array.isArray(tree) && tree.every(isValidTreeNode);
}

// ─── Export/import ───────────────────────────────────────────────────────────

function buildLibraryExportPayload(tree) {
  return {
    type: SCRIPT_RUNNER_LIBRARY_TYPE,
    version: 2,
    exportedAt: new Date().toISOString(),
    tree,
  };
}

function buildSingleScriptExportPayload(name, actions) {
  return {
    type: SCRIPT_RUNNER_SINGLE_TYPE,
    version: 1,
    exportedAt: new Date().toISOString(),
    name,
    actions,
  };
}

function buildFolderExportPayload(folder) {
  return {
    type: SCRIPT_RUNNER_FOLDER_TYPE,
    version: 2,
    exportedAt: new Date().toISOString(),
    folder,
  };
}

function triggerJsonDownload(fileName, payload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseImportPayload(payload) {
  if (!isPlainObject(payload)) {
    throw new Error("Некорректный формат файла");
  }

  if (payload.type === SCRIPT_RUNNER_LIBRARY_TYPE) {
    if (payload.version === 2 && isValidTree(payload.tree)) {
      return { kind: "tree", nodes: assignIdsToTree(payload.tree) };
    }
    if (payload.version === 1 && isPlainObject(payload.scripts)) {
      return { kind: "tree", nodes: flatObjectToTree(payload.scripts) };
    }
    throw new Error("Некорректный файл библиотеки");
  }

  if (payload.type === SCRIPT_RUNNER_FOLDER_TYPE) {
    if (payload.version === 2 && isPlainObject(payload.folder) && payload.folder.type === "folder") {
      const folder = { ...payload.folder, id: generateId(), children: assignIdsToTree(payload.folder.children || []) };
      return { kind: "tree", nodes: [folder] };
    }
    throw new Error("Некорректный файл группы");
  }

  if (payload.type === SCRIPT_RUNNER_SINGLE_TYPE) {
    if (!isValidActionsArray(payload.actions)) {
      throw new Error("В файле скрипта некорректные действия");
    }
    const name = String(payload.name ?? "").trim() || "Импортированный скрипт";
    return { kind: "tree", nodes: [{ id: generateId(), type: "script", name, actions: payload.actions }] };
  }

  throw new Error("Неизвестный формат файла");
}

function getElementCenter(el) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    rect,
  };
}

function toPagePoint(clientX, clientY) {
  return {
    pageX: clientX + window.scrollX,
    pageY: clientY + window.scrollY,
  };
}

function toViewportPoint(point) {
  return {
    x: point.pageX - window.scrollX,
    y: point.pageY - window.scrollY,
  };
}

function getUnderlyingElement(clientX, clientY) {
  const elements = document.elementsFromPoint(clientX, clientY);
  return (
    elements.find(
      (el) => el instanceof Element && !isScriptRunnerControl(el)
    ) ?? null
  );
}

function resolveEditableElement(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    return el;
  }
  return (
    el.querySelector("input, textarea, select, [contenteditable='true']") ?? el
  );
}

function normalizeDateLikeValue(el, value) {
  const raw = String(value ?? "").trim();
  if (!raw) return raw;

  if (!(el instanceof HTMLInputElement)) {
    return raw;
  }

  if (el.type === "date") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const dotMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (dotMatch) return `${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1]}`;
  }

  if (el.type === "time") {
    const normalized = raw.replace(/\./g, ":");
    if (/^\d{2}:\d{2}$/.test(normalized)) return normalized;
    if (/^\d{2}:\d{2}:\d{2}$/.test(normalized)) return normalized.slice(0, 5);
  }

  if (el.type === "datetime-local") {
    const normalized = raw.replace(" ", "T");
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) return normalized;
  }

  return raw;
}

function setElementValue(el, value) {
  const normalizedValue = normalizeDateLikeValue(el, value);
  const proto =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, normalizedValue);
  else el.value = normalizedValue;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.setAttribute("value", normalizedValue);
  }
  el.dispatchEvent(new Event("input",  { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

function parseActionDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const dotMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotMatch) {
    const date = new Date(`${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1]}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRuDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function generateRandomDateValue(el, minDateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minAllowed = new Date(today);
  minAllowed.setDate(minAllowed.getDate() + 1);

  const oneMonthLimit = new Date(today);
  oneMonthLimit.setMonth(oneMonthLimit.getMonth() + 1);

  const customMin = parseActionDate(minDateValue);
  const actualMin =
    customMin && customMin > minAllowed ? customMin : minAllowed;

  if (actualMin > oneMonthLimit) {
    throw new Error("Минимальная дата выходит за пределы месяца");
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const daysRange = Math.floor((oneMonthLimit - actualMin) / dayMs);
  const randomOffset = Math.floor(Math.random() * (daysRange + 1));
  const selectedDate = new Date(actualMin);
  selectedDate.setDate(actualMin.getDate() + randomOffset);

  if (el instanceof HTMLInputElement && el.type === "date") {
    return formatIsoDate(selectedDate);
  }

  return formatRuDate(selectedDate);
}

function parseActionTime(value) {
  const raw = String(value ?? "").trim().replace(/\./g, ":");
  const match = raw.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatTimeFromMinutes(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getPreviousActionValue(action, actionIndex, context) {
  const previousValue =
    context?.actionValues?.[Number(action.sourceActionIndex)];
  if (previousValue == null || previousValue === "") {
    throw new Error(
      `Нет значения у шага ${Number(action.sourceActionIndex) + 1}`
    );
  }
  if (Number(action.sourceActionIndex) >= actionIndex) {
    throw new Error("Можно ссылаться только на предыдущие шаги");
  }
  return previousValue;
}

function getPreviousActionValueByIndex(stepIndex, actionIndex, context) {
  const numericIndex = Number(stepIndex);
  const previousValue = context?.actionValues?.[numericIndex];
  if (previousValue == null || previousValue === "") {
    throw new Error(`Нет значения у шага ${numericIndex + 1}`);
  }
  if (numericIndex >= actionIndex) {
    throw new Error("Можно ссылаться только на предыдущие шаги");
  }
  return previousValue;
}

function resolveRandomMinDate(action, actionIndex, context, fallbackValue) {
  if (action.minSourceType === "previous") {
    const previousValue = getPreviousActionValueByIndex(
      action.minSourceActionIndex,
      actionIndex,
      context
    );
    return parseActionDate(previousValue) ?? parseActionDate(fallbackValue);
  }
  return parseActionDate(fallbackValue);
}

function resolveRandomMinTime(action, actionIndex, context, fallbackValue) {
  if (action.minSourceType === "previous") {
    const previousValue = getPreviousActionValueByIndex(
      action.minSourceActionIndex,
      actionIndex,
      context
    );
    return parseActionTime(previousValue) ?? parseActionTime(fallbackValue);
  }
  return parseActionTime(fallbackValue);
}

function resolveTypeActionValue(el, action, actionIndex, context) {
  const dataSource = action.dataSource ?? "manual";

  if (dataSource === "reference") {
    return getPreviousActionValue(action, actionIndex, context);
  }

  if (dataSource !== "random") {
    return action.text ?? "";
  }

  const randomType = action.randomType ?? "number";

  if (randomType === "number") {
    const min = Number(action.minNumber ?? 0);
    const max = Number(action.maxNumber ?? 100);
    if (Number.isNaN(min) || Number.isNaN(max) || min > max) {
      throw new Error("Некорректный диапазон случайного числа");
    }
    return String(randomInt(min, max));
  }

  if (randomType === "date") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const defaultMin = new Date(today);
    defaultMin.setDate(defaultMin.getDate() + 1);
    const defaultMax = new Date(today);
    defaultMax.setMonth(defaultMax.getMonth() + 1);

    const minDate =
      resolveRandomMinDate(action, actionIndex, context, action.minDate) ??
      defaultMin;
    const maxDate = parseActionDate(action.maxDate) ?? defaultMax;
    if (minDate > maxDate) {
      throw new Error("Некорректный диапазон случайной даты");
    }
    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((maxDate - minDate) / dayMs);
    const selectedDate = new Date(minDate);
    selectedDate.setDate(minDate.getDate() + randomInt(0, diffDays));
    return el instanceof HTMLInputElement && el.type === "date"
      ? formatIsoDate(selectedDate)
      : formatRuDate(selectedDate);
  }

  if (randomType === "time") {
    const minMinutes =
      resolveRandomMinTime(action, actionIndex, context, action.minTime) ?? 0;
    const maxMinutes = parseActionTime(action.maxTime) ?? (23 * 60 + 59);
    if (minMinutes > maxMinutes) {
      throw new Error("Некорректный диапазон случайного времени");
    }
    return formatTimeFromMinutes(randomInt(minMinutes, maxMinutes));
  }

  if (randomType === "text") {
    const minLength = Number(action.minLength ?? 6);
    const maxLength = Number(action.maxLength ?? 12);
    if (
      Number.isNaN(minLength) ||
      Number.isNaN(maxLength) ||
      minLength < 1 ||
      minLength > maxLength
    ) {
      throw new Error("Некорректная длина случайного текста");
    }
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const targetLength = randomInt(minLength, maxLength);
    return Array.from({ length: targetLength }, () =>
      alphabet[randomInt(0, alphabet.length - 1)]
    ).join("");
  }

  throw new Error(`Неизвестный тип случайных данных: ${randomType}`);
}

function actionHasOutput(action) {
  return action.type === "type" || action.type === "randomDate";
}

function createDefaultFields(type) {
  if (type === "type") {
    return {
      dataSource: "manual",
      randomType: "number",
      minSourceType: "manual",
    };
  }
  return {};
}

function isFieldRequiredForType(field, newFields) {
  const dataSource = newFields.dataSource ?? "manual";
  const randomType = newFields.randomType ?? "number";

  if (field === "selector") return true;
  if (field === "dataSource") return true;
  if (dataSource === "manual") return field === "text";
  if (dataSource === "reference") return field === "sourceActionIndex";
  if (dataSource === "random") {
    if (field === "randomType") return true;
    if (randomType === "number") return field === "minNumber" || field === "maxNumber";
    if (randomType === "date" || randomType === "time") {
      if (field === "minSourceType") return true;
      if (field === "minSourceActionIndex") {
        return newFields.minSourceType === "previous";
      }
      return false;
    }
    if (randomType === "text") return field === "minLength" || field === "maxLength";
  }
  return false;
}

// ─── Action config ────────────────────────────────────────────────────────────
const ACTION_TYPES = {
  click:           { label: "Клик",         fields: ["selector"] },
  type:            {
    label: "Ввод данных",
    fields: [
      "selector",
      "dataSource",
      "text",
      "randomType",
      "minSourceType",
      "minSourceActionIndex",
      "minNumber",
      "maxNumber",
      "minDate",
      "maxDate",
      "minTime",
      "maxTime",
      "minLength",
      "maxLength",
      "sourceActionIndex",
    ],
  },
  randomDate:      { label: "Случайная дата", fields: ["selector", "minDate"] },
  press:           { label: "Клавиша",       fields: ["key"] },
  wait:            { label: "Пауза",         fields: ["ms"] },
  scroll:          { label: "Прокрутка",     fields: ["x", "y"] },
  waitForSelector: { label: "Ждать элемент", fields: ["selector", "timeout"] },
  navigate:        { label: "URL",           fields: ["url"] },
};

const KEY_OPTIONS = ["Enter","Tab","Escape","Backspace","Delete","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"];

function isScriptRunnerControl(target) {
  return target instanceof Element && !!target.closest("[data-script-runner-control]");
}

function describe(action) {
  switch (action.type) {
    case "click":
      return action.point
        ? `Клик в точку (${Math.round(action.point.pageX)}, ${Math.round(action.point.pageY)})`
        : `Клик → ${action.selector}`;
    case "type":
      if ((action.dataSource ?? "manual") === "reference") {
        return `Значение из шага ${Number(action.sourceActionIndex) + 1} → ${action.selector}`;
      }
      if ((action.dataSource ?? "manual") === "random") {
        if (
          (action.randomType === "date" || action.randomType === "time") &&
          action.minSourceType === "previous"
        ) {
          return `Случайные данные (${action.randomType}) от шага ${Number(action.minSourceActionIndex) + 1} → ${action.selector}`;
        }
        return `Случайные данные (${action.randomType ?? "number"}) → ${action.selector}`;
      }
      return `"${action.text}" → ${action.selector}`;
    case "randomDate":
      return action.minDate
        ? `Случайная дата от ${action.minDate} → ${action.selector}`
        : `Случайная дата → ${action.selector}`;
    case "press":           return `Клавиша: ${action.key}`;
    case "wait":            return `Пауза ${action.ms} мс`;
    case "scroll":          return `Прокрутка (${action.x ?? 0}, ${action.y ?? 0})`;
    case "waitForSelector": return `Ждать ${action.selector}`;
    case "navigate":        return action.url;
    default:                return action.type;
  }
}

// ─── Executor ─────────────────────────────────────────────────────────────────
async function executeAction(action, actionIndex = 0, context = {}) {
  switch (action.type) {
    case "navigate": window.location.href = action.url; await sleep(2000); break;
    case "click": {
      if (action.point) {
        const clientX = action.point.pageX - window.scrollX;
        const clientY = action.point.pageY - window.scrollY;
        const el = getUnderlyingElement(clientX, clientY);
        if (!el) throw new Error("Не найден элемент в точке");
        ["mousedown", "mouseup", "click"].forEach((type) => {
          el.dispatchEvent(
            new MouseEvent(type, {
              bubbles: true,
              cancelable: true,
              clientX,
              clientY,
              view: window,
            })
          );
        });
        break;
      }
      const el = document.querySelector(action.selector);
      if (!el) throw new Error(`Не найден: ${action.selector}`);
      el.click(); break;
    }
    case "type": {
      const el = resolveEditableElement(action.selector);
      if (!el) throw new Error(`Не найден: ${action.selector}`);
      el.focus();
      const resolvedValue = resolveTypeActionValue(el, action, actionIndex, context);
      setElementValue(el, resolvedValue);
      return { outputValue: resolvedValue };
    }
    case "randomDate": {
      const el = resolveEditableElement(action.selector);
      if (!el) throw new Error(`Не найден: ${action.selector}`);
      el.focus();
      const randomDateValue = generateRandomDateValue(el, action.minDate);
      setElementValue(el, randomDateValue);
      return { outputValue: randomDateValue };
    }
    case "press": {
      const t = document.activeElement ?? document.body;
      ["keydown","keypress","keyup"].forEach(type =>
        t.dispatchEvent(new KeyboardEvent(type, { key: action.key, bubbles: true, cancelable: true }))
      ); break;
    }
    case "wait": await sleep(Math.max(0, Number(action.ms) || 1000)); break;
    case "scroll": window.scrollBy(Number(action.x) || 0, Number(action.y) || 0); break;
    case "waitForSelector": {
      const timeout = Number(action.timeout) || 5000;
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) { if (document.querySelector(action.selector)) return; await sleep(100); }
      throw new Error(`Элемент не появился за ${timeout} мс: ${action.selector}`);
    }
    default: throw new Error(`Неизвестный тип: ${action.type}`);
  }
}

// ─── DnD + Resize hook ────────────────────────────────────────────────────────
function useDragResize({ initialX, initialY, initialW, initialH, minW = 260, minH = 180 }) {
  const [pos,  setPos]  = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ w: initialW, h: initialH });
  const posRef  = useRef(pos);
  const sizeRef = useRef(size);
  posRef.current  = pos;
  sizeRef.current = size;

  const onDragMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const { x: px, y: py } = posRef.current;
    const sx = e.clientX, sy = e.clientY;
    const onMove = (me) => setPos({
      x: Math.max(0, px + me.clientX - sx),
      y: Math.max(0, py + me.clientY - sy),
    });
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, []);

  const onResizeMouseDown = useCallback((e, dir) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const { w: sw, h: sh } = sizeRef.current;
    const { x: px, y: py } = posRef.current;
    const sx = e.clientX, sy = e.clientY;
    const onMove = (me) => {
      const dx = me.clientX - sx, dy = me.clientY - sy;
      let nw = sw, nh = sh, nx = px, ny = py;
      if (dir.includes("e")) nw = Math.max(minW, sw + dx);
      if (dir.includes("s")) nh = Math.max(minH, sh + dy);
      if (dir.includes("w")) { nw = Math.max(minW, sw - dx); if (nw > minW) nx = px + dx; }
      if (dir.includes("n")) { nh = Math.max(minH, sh - dy); if (nh > minH) ny = py + dy; }
      setSize({ w: nw, h: nh });
      setPos({ x: nx, y: ny });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, [minW, minH]);

  return { pos, size, onDragMouseDown, onResizeMouseDown };
}

// ─── DraggableWindow ──────────────────────────────────────────────────────────
const RESIZE_DIRS = ["n","ne","e","se","s","sw","w","nw"];

function DraggableWindow({ show, title, children, onClose, defaultX, defaultY, defaultW, defaultH, minW, minH, zIndex, onFocus }) {
  const { pos, size, onDragMouseDown, onResizeMouseDown } = useDragResize({
    initialX: defaultX, initialY: defaultY, initialW: defaultW, initialH: defaultH, minW, minH,
  });

  if (!show) return null;

  return ReactDOM.createPortal(
    <div
      data-script-runner-control
      className={classes.win}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex }}
      onMouseDown={onFocus}
    >
      {/* Title bar */}
      <div data-script-runner-control className={classes.winTitle} onMouseDown={onDragMouseDown}>
        <span data-script-runner-control className={classes.winTitleText}>{title}</span>
        <button data-script-runner-control className={classes.winClose} onClick={onClose}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div data-script-runner-control className={classes.winBody}>
        {children}
      </div>

      {/* Resize handles */}
      {RESIZE_DIRS.map(dir => (
        <div
          key={dir}
          data-script-runner-control
          className={`${classes.rh} ${classes["rh_" + dir]}`}
          onMouseDown={e => onResizeMouseDown(e, dir)}
        />
      ))}
    </div>,
    document.body
  );
}

// ─── Pick highlight portal ────────────────────────────────────────────────────
function PickHighlight({ rect }) {
  if (!rect) return null;
  return ReactDOM.createPortal(
    <div data-script-runner-control className={classes.pickHL}
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />,
    document.body
  );
}

function TargetMarkers({ markers, onMarkerHoldStart, holdState, draggingMarker }) {
  if (!markers.length) return null;
  return ReactDOM.createPortal(
    <div className={classes.markersLayer}>
      {markers.map((marker) => (
        (() => {
          const isHolding = holdState?.markerId === marker.id;
          const isDragging =
            marker.kind === "manual" &&
            draggingMarker &&
            draggingMarker.actionIndex === marker.actionIndex &&
            draggingMarker.isDraft === marker.isDraft;

          return (
            <div
              key={marker.id}
              data-script-runner-control
              className={`${classes.targetMarker} ${
                marker.kind === "manual" ? classes.targetMarkerManual : classes.targetMarkerElement
              } ${marker.isCurrent ? classes.targetMarkerCurrent : classes.targetMarkerPrev} ${
                isHolding ? classes.targetMarkerHolding : ""
              } ${isDragging ? classes.targetMarkerDragging : ""}`}
              style={{
                left: marker.x,
                top: marker.y,
                "--marker-progress": `${Math.round((holdState?.progress ?? 0) * 360)}deg`,
              }}
              title={marker.title}
              onMouseDown={
                marker.kind === "manual"
                  ? (e) => onMarkerHoldStart(e, marker)
                  : undefined
              }
            >
              <span data-script-runner-control className={classes.targetMarkerNum}>
                {marker.order}
              </span>
              {marker.kind === "manual" && (
                <span
                  data-script-runner-control
                  className={`${classes.targetMarkerProgress} ${
                    isHolding ? classes.targetMarkerProgressVisible : ""
                  }`}
                />
              )}
            </div>
          );
        })()
      ))}
    </div>,
    document.body
  );
}

// ─── Icons (matching site style) ─────────────────────────────────────────────
const IconCode = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const IconPlay = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const IconStop = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const IconList = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
);
const IconBook = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
);
const IconReport = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const IconTarget = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
);
const IconSave = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const IconPoint = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
    <circle cx="12" cy="11" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);
const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
);
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeOff = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a21.76 21.76 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.8 21.8 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <path d="m1 1 22 22" />
  </svg>
);
const IconDownload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" />
    <polyline points="7 11 12 16 17 11" />
    <path d="M4 21h16" />
  </svg>
);
const IconUpload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21V9" />
    <polyline points="7 13 12 8 17 13" />
    <path d="M4 3h16" />
  </svg>
);
const IconFolder = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconFolderPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
);
const IconGrip = () => (
  <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
    <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
    <circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>
    <circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  ScriptRunner
// ═══════════════════════════════════════════════════════════════════════════════
function ScriptRunner({ show, onClose }) {
  const barRef = useRef(null);
  const pickOverlayRef = useRef(null);
  const importInputRef = useRef(null);

  // ── Body style injection ─────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const clean = () => { const e = document.getElementById("sr-inject"); if (e) e.remove(); };
    if (!show) { clean(); return; }
    const apply = () => {
      const h = barRef.current?.offsetHeight ?? 0;
      let tag = document.getElementById("sr-inject");
      if (!tag) { tag = document.createElement("style"); tag.id = "sr-inject"; document.head.appendChild(tag); }
      tag.textContent = `body{padding-top:${h}px!important;box-sizing:border-box!important;height:100vh!important;overflow:hidden!important}`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    if (barRef.current) ro.observe(barRef.current);
    return () => { ro.disconnect(); clean(); };
  }, [show]);

  // ── Core state ───────────────────────────────────────────────────────────────
  const [actions, setActions]     = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport]       = useState(null);
  const stopRef = useRef(false);

  // ── Windows visibility ────────────────────────────────────────────────────────
  const [showAdd,      setShowAdd]      = useState(false);
  const [showScenario, setShowScenario] = useState(false);
  const [showScripts,  setShowScripts]  = useState(false);
  const [showReport,   setShowReport]   = useState(false);

  // ── z-index management ────────────────────────────────────────────────────────
  const topZ = useRef(10010);
  const [zMap, setZMap] = useState({
    add: 10010,
    scenario: 10011,
    scripts: 10012,
    report: 10013,
  });
  const bringToFront = (key) => {
    topZ.current += 1;
    setZMap(p => ({ ...p, [key]: topZ.current }));
  };

  // ── Add-action form state ─────────────────────────────────────────────────────
  const [newType,   setNewType]   = useState("click");
  const [newFields, setNewFields] = useState(createDefaultFields("click"));

  // ── Pick mode ─────────────────────────────────────────────────────────────────
  const [pickMode,   setPickMode]   = useState(null);
  const [pickField,  setPickField]  = useState(null);
  const [hlRect,     setHlRect]     = useState(null);
  const [pickPreviewPoint, setPickPreviewPoint] = useState(null);
  const [markerVersion, setMarkerVersion] = useState(0);
  const [draggingMarker, setDraggingMarker] = useState(null);
  const [markerHoldState, setMarkerHoldState] = useState(null);
  const isPickMode = pickMode !== null;

  const getPickTarget = useCallback((clientX, clientY) => {
    const overlay = pickOverlayRef.current;
    if (!overlay) return null;
    const prevPointerEvents = overlay.style.pointerEvents;
    overlay.style.pointerEvents = "none";
    const target = getUnderlyingElement(clientX, clientY);
    overlay.style.pointerEvents = prevPointerEvents;
    if (!(target instanceof Element)) return null;
    return target;
  }, []);

  const updatePickHighlight = useCallback((clientX, clientY) => {
    const target = getPickTarget(clientX, clientY);
    if (!target) {
      setHlRect(null);
      return null;
    }
    const r = target.getBoundingClientRect();
    setHlRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    return target;
  }, [getPickTarget]);

  const buildMarkerFromAction = useCallback((action, order, id, isDraft = false) => {
    if (action.point?.pageX != null && action.point?.pageY != null) {
      const point = toViewportPoint(action.point);
      return {
        id,
        order,
        x: point.x,
        y: point.y,
        kind: "manual",
        title: isDraft ? `Точка для шага ${order}` : `Шаг ${order}: ручная точка`,
        isDraft,
      };
    }
    if (!action.selector) return null;
    const target = document.querySelector(action.selector);
    if (!(target instanceof Element)) return null;
    const { x, y } = getElementCenter(target);
    return {
      id,
      order,
      x,
      y,
      kind: "element",
      title: isDraft ? `Элемент для шага ${order}` : `Шаг ${order}: ${action.selector}`,
      isDraft,
    };
  }, []);

  const handlePickOverlayMouseMove = useCallback((e) => {
    if (pickMode === "point") {
      setPickPreviewPoint(toPagePoint(e.clientX, e.clientY));
      setHlRect(null);
      return;
    }
    updatePickHighlight(e.clientX, e.clientY);
  }, [pickMode, updatePickHighlight]);

  const handlePickOverlayMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pickMode === "point") {
      const point = toPagePoint(e.clientX, e.clientY);
      setNewFields((p) => ({ ...p, point, selector: "" }));
      setPickPreviewPoint(point);
    } else {
      const target = updatePickHighlight(e.clientX, e.clientY);
      const sel = generateSelector(target);
      if (sel && pickField) {
        setNewFields((p) => ({ ...p, [pickField]: sel, point: null }));
      }
    }
    setPickMode(null);
    setPickField(null);
    setHlRect(null);
  }, [pickField, pickMode, updatePickHighlight]);

  const handlePickOverlayClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    if (!isPickMode) return undefined;
    document.body.dataset.scriptRunnerPickMode = "true";
    document.body.style.cursor = "crosshair";
    return () => {
      delete document.body.dataset.scriptRunnerPickMode;
      document.body.style.cursor = "";
    };
  }, [isPickMode]);

  useEffect(() => {
    if (!show) return undefined;
    const syncMarkers = () => setMarkerVersion((v) => v + 1);
    window.addEventListener("scroll", syncMarkers, true);
    window.addEventListener("resize", syncMarkers);
    return () => {
      window.removeEventListener("scroll", syncMarkers, true);
      window.removeEventListener("resize", syncMarkers);
    };
  }, [show]);

  useEffect(() => {
    if (!draggingMarker) return undefined;
    const handleMove = (e) => {
      const point = toPagePoint(e.clientX, e.clientY);
      if (draggingMarker.isDraft) {
        setNewFields((prev) => ({ ...prev, point, selector: "" }));
      } else {
        setActions((prev) =>
          prev.map((action, index) =>
            index === draggingMarker.actionIndex
              ? { ...action, point, selector: "" }
              : action
          )
        );
      }
      setMarkerVersion((v) => v + 1);
    };
    const handleUp = () => {
      setDraggingMarker(null);
      setMarkerHoldState(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [draggingMarker]);

  useEffect(() => {
    if (!markerHoldState || draggingMarker) return undefined;
    const startedAt = markerHoldState.startedAt;
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / MARKER_HOLD_TO_DRAG_MS);
      setMarkerHoldState((prev) =>
        prev
          ? {
              ...prev,
              progress,
            }
          : prev
      );
      if (progress >= 1) {
        window.clearInterval(intervalId);
        setDraggingMarker({
          actionIndex: markerHoldState.actionIndex,
          isDraft: markerHoldState.isDraft,
        });
      }
    }, 50);

    const cancelHold = () => {
      setMarkerHoldState((prev) => (prev?.progress >= 1 ? prev : null));
    };

    window.addEventListener("mouseup", cancelHold);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("mouseup", cancelHold);
    };
  }, [markerHoldState?.markerId, markerHoldState?.startedAt, draggingMarker]);

  // ── Script tree ─────────────────────────────────────────────────────────────
  const [scriptTree, setScriptTree] = useState([]);
  const [saveName, setSaveName] = useState("");
  const [editingScriptId, setEditingScriptId] = useState(null);
  const [visibleNodeId, setVisibleNodeId] = useState(null);
  const [renamingNodeId, setRenamingNodeId] = useState(null);
  const [renamingValue, setRenamingValue] = useState("");
  const [createTargetParentId, setCreateTargetParentId] = useState(null);
  const [scriptsNotice, setScriptsNotice] = useState(null);

  const editingNode = editingScriptId ? findNodeById(scriptTree, editingScriptId) : null;
  const editingScriptName = editingNode?.type === "script" ? editingNode.name : null;

  const loadTree = useCallback(() => {
    try {
      const raw = localStorage.getItem(SCRIPTS_TREE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidTree(parsed)) {
          setScriptTree(assignIdsToTree(parsed));
          return;
        }
      }
    } catch { /* fall through */ }
    const migrated = migrateFromFlatFormat();
    if (migrated.length) {
      localStorage.setItem(SCRIPTS_TREE_STORAGE_KEY, JSON.stringify(migrated));
      Object.keys(localStorage)
        .filter((key) => key.startsWith("karsavia_script_"))
        .forEach((key) => localStorage.removeItem(key));
    }
    setScriptTree(migrated);
  }, []);
  useEffect(loadTree, [loadTree]);

  const persistTree = useCallback((nextTree) => {
    try { localStorage.setItem(SCRIPTS_TREE_STORAGE_KEY, JSON.stringify(nextTree)); } catch { /* ignore */ }
    setScriptTree(nextTree);
  }, []);

  const createScript = useCallback((parentId, name) => {
    const node = { id: generateId(), type: "script", name, actions: [] };
    setScriptTree((prev) => insertNode(prev, parentId, node));
  }, []);

  const createFolder = useCallback((parentId, name) => {
    const node = { id: generateId(), type: "folder", name, collapsed: false, children: [] };
    setScriptTree((prev) => insertNode(prev, parentId, node));
  }, []);

  const saveScript = () => {
    if (!saveName.trim()) return;
    createScript(createTargetParentId, saveName.trim());
    setSaveName("");
  };

  const saveFolder = () => {
    if (!saveName.trim()) return;
    createFolder(createTargetParentId, saveName.trim());
    setSaveName("");
  };

  const deleteNode = useCallback((id) => {
    setScriptTree((prev) => removeNodeById(prev, id));
    if (editingScriptId === id) { setEditingScriptId(null); setActions([]); setShowAdd(false); }
    if (visibleNodeId === id) { setVisibleNodeId(null); }
  }, [editingScriptId, visibleNodeId]);

  const renameNode = useCallback((id, newName) => {
    setScriptTree((prev) => updateNodeById(prev, id, (n) => ({ ...n, name: newName })));
  }, []);

  const startRename = useCallback((id, currentName) => {
    setRenamingNodeId(id);
    setRenamingValue(currentName);
  }, []);

  const commitRename = useCallback(() => {
    if (renamingNodeId && renamingValue.trim()) {
      renameNode(renamingNodeId, renamingValue.trim());
    }
    setRenamingNodeId(null);
    setRenamingValue("");
  }, [renamingNodeId, renamingValue, renameNode]);

  const toggleCollapse = useCallback((id) => {
    setScriptTree((prev) => updateNodeById(prev, id, (n) => ({ ...n, collapsed: !n.collapsed })));
  }, []);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const [dragId, setDragId] = useState(null);
  const [dropInfo, setDropInfo] = useState(null);

  const handleDragStart = useCallback((e, nodeId) => {
    setDragId(nodeId);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", nodeId); } catch { /* IE */ }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDropInfo(null);
  }, []);

  const computeDropPosition = useCallback((e, nodeId, nodeType) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    const ratio = y / h;

    if (nodeType === "folder") {
      if (ratio < 0.25) return { targetId: nodeId, position: "before" };
      if (ratio > 0.75) return { targetId: nodeId, position: "after" };
      return { targetId: nodeId, position: "inside" };
    }
    return { targetId: nodeId, position: ratio < 0.5 ? "before" : "after" };
  }, []);

  const handleDragOver = useCallback((e, nodeId, nodeType) => {
    if (!dragId || dragId === nodeId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const info = computeDropPosition(e, nodeId, nodeType);
    setDropInfo((prev) => {
      if (prev?.targetId === info.targetId && prev?.position === info.position) return prev;
      return info;
    });
  }, [dragId, computeDropPosition]);

  const handleDragLeaveList = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDropInfo(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragId || !dropInfo) { setDragId(null); setDropInfo(null); return; }
    if (dropInfo.position === "inside" && isDescendantOf(scriptTree, dragId, dropInfo.targetId)) {
      setDragId(null); setDropInfo(null); return;
    }
    setScriptTree((prev) => reorderNode(prev, dragId, dropInfo.targetId, dropInfo.position));
    setDragId(null);
    setDropInfo(null);
  }, [dragId, dropInfo, scriptTree]);

  const runScriptById = useCallback((id) => {
    const node = findNodeById(scriptTree, id);
    if (node?.type === "script") runScript(node.actions);
  }, [scriptTree]);

  const runFolderById = useCallback((id) => {
    const node = findNodeById(scriptTree, id);
    if (node?.type === "folder") {
      const scripts = collectScripts(node);
      const allActions = [];
      scripts.forEach((s, i) => {
        allActions.push(...s.actions);
        if (i < scripts.length - 1) {
          allActions.push({ type: "wait", ms: "4000" });
        }
      });
      if (allActions.length) runScript(allActions);
    }
  }, [scriptTree]);

  const editScript = useCallback((id) => {
    if (editingScriptId === id) {
      setEditingScriptId(null); setActions([]); setShowAdd(false); setShowScenario(false);
      return;
    }
    const node = findNodeById(scriptTree, id);
    if (node?.type !== "script") return;
    setEditingScriptId(id);
    setActions([...node.actions]);
    setShowAdd(false); setShowScenario(false);
  }, [editingScriptId, scriptTree]);

  const toggleNodePreview = useCallback((id) => {
    setVisibleNodeId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    if (!editingScriptId) return;
    persistTree(updateNodeById(scriptTree, editingScriptId, (n) => ({ ...n, actions: [...actions] })));
  }, [editingScriptId, actions]);

  useEffect(() => {
    if (editingScriptId || scriptTree.length === 0) return;
    persistTree(scriptTree);
  }, [scriptTree, editingScriptId]);

  // ── Export/import ─────────────────────────────────────────────────────────────
  const exportLibrary = useCallback(() => {
    const payload = buildLibraryExportPayload(scriptTree);
    triggerJsonDownload(`${makeSafeFileName("script-runner-library")}.json`, payload);
    setScriptsNotice({ type: "success", text: `Экспортировано скриптов: ${countScripts(scriptTree)}` });
  }, [scriptTree]);

  const exportSingleScript = useCallback((id) => {
    const node = findNodeById(scriptTree, id);
    if (node?.type !== "script") return;
    const payload = buildSingleScriptExportPayload(node.name, node.actions);
    triggerJsonDownload(`${makeSafeFileName(node.name, "script")}.json`, payload);
    setScriptsNotice({ type: "success", text: `Скрипт "${node.name}" экспортирован` });
  }, [scriptTree]);

  const exportFolder = useCallback((id) => {
    const node = findNodeById(scriptTree, id);
    if (node?.type !== "folder") return;
    const payload = buildFolderExportPayload(node);
    triggerJsonDownload(`${makeSafeFileName(node.name, "folder")}.json`, payload);
    setScriptsNotice({ type: "success", text: `Группа "${node.name}" экспортирована` });
  }, [scriptTree]);

  const triggerImport = useCallback(() => {
    setScriptsNotice(null);
    if (!importInputRef.current) return;
    importInputRef.current.value = "";
    importInputRef.current.click();
  }, []);

  const handleImportFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const result = parseImportPayload(payload);
      const importedNodes = assignIdsToTree(result.nodes);
      setScriptTree((prev) => [...prev, ...importedNodes]);
      const sc = importedNodes.flatMap((n) => n.type === "script" ? [n] : collectScripts(n));
      setScriptsNotice({ type: "success", text: `Импортировано: ${sc.length} скриптов` });
    } catch (error) {
      setScriptsNotice({ type: "error", text: error?.message || "Не удалось импортировать файл" });
    } finally {
      e.target.value = "";
    }
  }, []);

  // ── Form helpers ───────────────────────────────────────────────────────────────
  const setField = (name, val) => setNewFields((p) => ({
    ...p,
    [name]: val,
    ...(name === "selector" ? { point: null } : {}),
    ...(name === "dataSource" && val !== "random"
      ? { randomType: undefined, minSourceType: "manual", minSourceActionIndex: "" }
      : {}),
    ...(name === "randomType"
      ? { minSourceType: "manual", minSourceActionIndex: "" }
      : {}),
    ...(name === "minSourceType" && val !== "previous"
      ? { minSourceActionIndex: "" }
      : {}),
  }));

  const addAction = () => {
    if (
      newType === "click" &&
      !newFields.selector &&
      !newFields.point
    ) return;
    const required = (ACTION_TYPES[newType]?.fields ?? []).filter((f) => {
      if (f === "x" || f === "y") return false;
      if (newType === "click" && f === "selector") return false;
      if (newType === "randomDate" && f === "minDate") return false;
      if (newType === "type") return isFieldRequiredForType(f, newFields);
      return true;
    });
    for (const f of required) { if (!newFields[f]) return; }
    setActions((p) => [
      ...p,
      { type: newType, ...newFields },
      { type: "wait", ms: 500 },
    ]);
    setNewFields(createDefaultFields(newType));
    setPickPreviewPoint(null);
    setMarkerVersion((v) => v + 1);
  };

  const deleteAction = (i) => setActions(p => p.filter((_, j) => j !== i));
  const moveAction   = (from, to) => {
    setActions(p => { const a = [...p]; const [item] = a.splice(from, 1); a.splice(to, 0, item); return a; });
  };

  // ── Run ────────────────────────────────────────────────────────────────────────
  const runScript = async (scriptActions = actions) => {
    if (!scriptActions.length || isRunning) return;
    setIsRunning(true); stopRef.current = false;
    setReport(null); setShowReport(true); bringToFront("report");
    const results = [];
    const actionValues = {};
    for (let i = 0; i < scriptActions.length; i++) {
      if (stopRef.current) {
        results.push({ index: i, action: scriptActions[i], status: "stopped", message: "Остановлено", duration: 0 });
        break;
      }
      const t0 = Date.now();
      try {
        const executionResult = await executeAction(scriptActions[i], i, { actionValues });
        if (executionResult?.outputValue != null) {
          actionValues[i] = executionResult.outputValue;
        }
        results.push({ index: i, action: scriptActions[i], status: "success", message: "OK", duration: Date.now() - t0 });
      } catch (err) {
        results.push({ index: i, action: scriptActions[i], status: "error", message: err.message, duration: Date.now() - t0 });
        break;
      }
      setReport([...results]);
    }
    setReport([...results]); setIsRunning(false);
  };

  // ── Report helpers ─────────────────────────────────────────────────────────────
  const okCount    = report?.filter(r => r.status === "success").length ?? 0;
  const totalCount = report?.length ?? 0;
  const totalMs    = report?.reduce((s, r) => s + (r.duration ?? 0), 0) ?? 0;
  const allOk      = okCount === totalCount && totalCount > 0;
  const draftAction = { type: newType, ...newFields };
  const previewActions = React.useMemo(() => {
    if (visibleNodeId == null) return [];
    if (visibleNodeId === editingScriptId) return actions;
    const node = findNodeById(scriptTree, visibleNodeId);
    if (!node) return [];
    if (node.type === "script") return node.actions ?? [];
    return collectScripts(node).flatMap((s) => s.actions);
  }, [visibleNodeId, editingScriptId, actions, scriptTree]);

  const markers = React.useMemo(() => {
    const actionMarkers = previewActions
      .map((action, index) => {
        const marker = buildMarkerFromAction(action, index + 1, `action-${index}`);
        return marker ? { ...marker, actionIndex: index, isDraft: false } : null;
      })
      .filter(Boolean);

    const draftMarker =
      showAdd &&
      editingScriptId &&
      visibleNodeId === editingScriptId &&
      (newFields.selector || newFields.point)
        ? buildMarkerFromAction(
            pickMode === "point" && pickPreviewPoint
              ? { ...draftAction, point: pickPreviewPoint }
              : draftAction,
            previewActions.length + 1,
            "draft-marker",
            true
          )
        : null;

    const allMarkers = [
      ...actionMarkers,
      ...(draftMarker ? [{ ...draftMarker, isDraft: true }] : []),
    ];

    return allMarkers.map((marker, index) => ({
      ...marker,
      isCurrent: index === allMarkers.length - 1,
    }));
  }, [
    previewActions,
    showAdd,
    editingScriptId,
    visibleNodeId,
    newFields,
    draftAction,
    pickMode,
    pickPreviewPoint,
    buildMarkerFromAction,
    markerVersion,
  ]);

  const shouldShowActionField = (field) => {
    if (field === "selector") return true;
    if (field === "text") return (newFields.dataSource ?? "manual") === "manual";
    if (field === "dataSource") return true;
    if (field === "randomType") return newFields.dataSource === "random";
    if (field === "minSourceType") {
      return (
        newFields.dataSource === "random" &&
        (newFields.randomType === "date" || newFields.randomType === "time")
      );
    }
    if (field === "minSourceActionIndex") {
      return (
        newFields.dataSource === "random" &&
        (newFields.randomType === "date" || newFields.randomType === "time") &&
        newFields.minSourceType === "previous"
      );
    }
    if (field === "minDate") {
      return (
        newFields.dataSource === "random" &&
        newFields.randomType === "date" &&
        (newFields.minSourceType ?? "manual") === "manual"
      );
    }
    if (field === "maxDate") {
      return newFields.dataSource === "random" && newFields.randomType === "date";
    }
    if (field === "minNumber" || field === "maxNumber") {
      return newFields.dataSource === "random" && newFields.randomType === "number";
    }
    if (field === "minTime") {
      return (
        newFields.dataSource === "random" &&
        newFields.randomType === "time" &&
        (newFields.minSourceType ?? "manual") === "manual"
      );
    }
    if (field === "maxTime") {
      return newFields.dataSource === "random" && newFields.randomType === "time";
    }
    if (field === "minLength" || field === "maxLength") {
      return newFields.dataSource === "random" && newFields.randomType === "text";
    }
    if (field === "sourceActionIndex") {
      return newFields.dataSource === "reference";
    }
    return true;
  };
  if (!show) return null;

  // ── Viewport center reference for default window positions ────────────────────
  const vw = window.innerWidth, vh = window.innerHeight;

  return ReactDOM.createPortal(
    <>
      {/* Overlays */}
      <TargetMarkers
        markers={markers}
        holdState={markerHoldState}
        draggingMarker={draggingMarker}
        onMarkerHoldStart={(e, marker) => {
          e.preventDefault();
          e.stopPropagation();
          setMarkerHoldState({
            markerId: marker.id,
            actionIndex: marker.actionIndex,
            isDraft: marker.isDraft,
            progress: 0,
            startedAt: Date.now(),
          });
        }}
      />
      {isPickMode && ReactDOM.createPortal(
        <div
          ref={pickOverlayRef}
          data-script-runner-control
          className={classes.pickOverlay}
          onMouseMove={handlePickOverlayMouseMove}
          onMouseDown={handlePickOverlayMouseDown}
          onClick={handlePickOverlayClick}
        />,
        document.body
      )}
      {isPickMode && <PickHighlight rect={hlRect} />}
      {isPickMode && ReactDOM.createPortal(
        <div
          data-script-runner-control
          className={classes.pickBanner}
        >
          <IconTarget /> {pickMode === "point" ? "Поставьте точку" : "Кликните на элемент"}
          <button data-script-runner-control className={classes.pickBannerBtn}
            onClick={() => {
              setPickMode(null);
              setPickField(null);
              setHlRect(null);
              setPickPreviewPoint(null);
            }}>
            Отмена
          </button>
        </div>,
        document.body
      )}

      {/* ─── TOP BAR ─── */}
      <div
        ref={barRef}
        data-script-runner-control
        className={classes.bar}
      >
        {/* Logo */}
        <div data-script-runner-control className={classes.barLogo}>
          <span data-script-runner-control className={classes.barLogoIcon}><IconCode /></span>
          <span data-script-runner-control className={classes.barLogoText}>Script Runner</span>
        </div>

        <div data-script-runner-control className={classes.barSep} />

        {/* Run controls */}
        <div data-script-runner-control className={classes.barGroup}>
          {isRunning ? (
            <button data-script-runner-control className={`${classes.barBtn} ${classes.barBtnRed}`}
              onClick={() => (stopRef.current = true)}>
              <IconStop /> Стоп
            </button>
          ) : (
            <button data-script-runner-control className={`${classes.barBtn} ${classes.barBtnBlue}`}
              onClick={runScript} disabled={!actions.length}>
              <IconPlay /> Запустить
            </button>
          )}
        </div>

        <div data-script-runner-control className={classes.barSep} />

        {/* Window toggles */}
        <div data-script-runner-control className={classes.barGroup}>
          {editingScriptId && editingScriptName && (
            <>
              <div data-script-runner-control className={classes.barScriptStatus}>
                Выбран скрипт для редактирования:
                <span data-script-runner-control className={classes.barScriptName}>
                  {editingScriptName}
                </span>
              </div>
              <button data-script-runner-control
                className={`${classes.barBtn} ${showAdd ? classes.barBtnActive : ""}`}
                onClick={() => { setShowAdd(v => !v); if (!showAdd) bringToFront("add"); }}>
                <IconPlus /> Действие
              </button>
              <button data-script-runner-control
                className={`${classes.barBtn} ${showScenario ? classes.barBtnActive : ""}`}
                onClick={() => { setShowScenario(v => !v); if (!showScenario) bringToFront("scenario"); }}>
                <IconList />
                Сценарий
                {actions.length > 0 && <span data-script-runner-control className={classes.barBadge}>{actions.length}</span>}
              </button>
            </>
          )}
          <button data-script-runner-control
            className={`${classes.barBtn} ${showScripts ? classes.barBtnActive : ""}`}
            onClick={() => { setShowScripts(v => !v); if (!showScripts) bringToFront("scripts"); }}>
            <IconBook /> Скрипты
            {countScripts(scriptTree) > 0 && (
              <span data-script-runner-control className={classes.barBadge}>{countScripts(scriptTree)}</span>
            )}
          </button>
          {report && (
            <button data-script-runner-control
              className={`${classes.barBtn} ${showReport ? classes.barBtnActive : ""} ${allOk ? classes.barBtnGreen : classes.barBtnOrange}`}
              onClick={() => { setShowReport(v => !v); if (!showReport) bringToFront("report"); }}>
              <IconReport />
              {allOk ? "✓" : "✗"} {okCount}/{totalCount}
            </button>
          )}
        </div>

        {/* Close */}
        <button data-script-runner-control className={classes.barClose} onClick={onClose} title="Закрыть Script Runner">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* ─── ADD ACTION WINDOW ─── */}
      <DraggableWindow
        show={showAdd} title={editingScriptId && editingScriptName ? `Добавить действие: ${editingScriptName}` : "Добавить действие"} zIndex={zMap.add}
        onClose={() => setShowAdd(false)} onFocus={() => bringToFront("add")}
        defaultX={20} defaultY={80}
        defaultW={380} defaultH={340} minW={320} minH={240}
      >
        <div data-script-runner-control className={classes.formSection}>
          {/* Type selector */}
          <div data-script-runner-control className={classes.formRow}>
            <label data-script-runner-control className={classes.formLabel}>Тип действия</label>
            <select data-script-runner-control className={classes.formSelect}
              value={newType}
              onChange={e => {
                setNewType(e.target.value);
                setNewFields(createDefaultFields(e.target.value));
              }}>
              {Object.entries(ACTION_TYPES)
                .filter(([k]) => k !== "randomDate")
                .map(([k, { label }]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>

          {/* Dynamic fields */}
          {(ACTION_TYPES[newType]?.fields ?? [])
            .filter(shouldShowActionField)
            .map(field => (
            <div key={field} data-script-runner-control className={classes.formRow}>
              {field === "selector" && (
                <>
                  <label data-script-runner-control className={classes.formLabel}>CSS-селектор / ID</label>
                  <div data-script-runner-control className={classes.inputWithBtn}>
                    <input data-script-runner-control className={classes.formInput}
                      placeholder={newFields.point ? "Выбрана ручная точка" : "#id  .class  div > span"}
                      value={newFields.point ? `Точка (${Math.round(newFields.point.pageX)}, ${Math.round(newFields.point.pageY)})` : (newFields[field] ?? "")}
                      onChange={e => setField(field, e.target.value)} />
                    <button data-script-runner-control className={classes.pickBtn}
                      title="Выбрать элемент кликом"
                      onClick={() => {
                        setPickField(field);
                        setPickMode("selector");
                        setPickPreviewPoint(null);
                      }}>
                      <IconTarget />
                    </button>
                    {newType === "click" && (
                      <button data-script-runner-control className={`${classes.pickBtn} ${classes.pointBtn}`}
                        title="Поставить точку"
                        onClick={() => {
                          setPickField(field);
                          setPickMode("point");
                          setHlRect(null);
                        }}>
                        <IconPoint />
                      </button>
                    )}
                  </div>
                </>
              )}
              {field === "text" && (
                <>
                  <label data-script-runner-control className={classes.formLabel}>Значение</label>
                  <input data-script-runner-control className={classes.formInput}
                    placeholder="Введите значение..."
                    value={newFields[field] ?? ""}
                    onChange={e => setField(field, e.target.value)} />
                </>
              )}
              {field === "dataSource" && (
                <>
                  <label data-script-runner-control className={classes.formLabel}>Источник данных</label>
                  <select
                    data-script-runner-control
                    className={classes.formSelect}
                    value={newFields[field] ?? "manual"}
                    onChange={e => setField(field, e.target.value)}
                  >
                    <option value="manual">Ручное значение</option>
                    <option value="random">Случайные данные</option>
                  </select>
                </>
              )}
              {field === "randomType" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Тип случайных данных</label>
                    <select
                      data-script-runner-control
                      className={classes.formSelect}
                      value={newFields[field] ?? "number"}
                      onChange={e => setField(field, e.target.value)}
                    >
                      <option value="number">Число</option>
                      <option value="date">Дата</option>
                      <option value="time">Время</option>
                      <option value="text">Текст</option>
                    </select>
                  </>
              )}
              {field === "minSourceType" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Источник "не раньше"</label>
                    <select
                      data-script-runner-control
                      className={classes.formSelect}
                      value={newFields[field] ?? "manual"}
                      onChange={e => setField(field, e.target.value)}
                    >
                      <option value="manual">Вручную</option>
                      <option value="previous">Из предыдущего шага</option>
                    </select>
                  </>
              )}
              {field === "minSourceActionIndex" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Шаг для "не раньше"</label>
                    <select
                      data-script-runner-control
                      className={classes.formSelect}
                      value={newFields[field] ?? ""}
                      onChange={e => setField(field, e.target.value)}
                    >
                      <option value="">Выберите шаг</option>
                      {actions
                        .map((action, index) => ({ action, index }))
                        .filter(({ action }) => actionHasOutput(action))
                        .map(({ action, index }) => (
                          <option key={index} value={index}>
                            {index + 1}. {describe(action)}
                          </option>
                        ))}
                    </select>
                  </>
              )}
              {field === "minDate" && (
                <>
                  <label data-script-runner-control className={classes.formLabel}>Не раньше даты</label>
                  <input
                    data-script-runner-control
                    className={classes.formInput}
                    type="date"
                    value={newFields[field] ?? ""}
                    onChange={e => setField(field, e.target.value)}
                  />
                </>
              )}
              {field === "maxDate" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Не позже даты</label>
                    <input
                      data-script-runner-control
                      className={classes.formInput}
                      type="date"
                      value={newFields[field] ?? ""}
                      onChange={e => setField(field, e.target.value)}
                    />
                  </>
              )}
              {field === "minNumber" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Минимальное число</label>
                    <input
                      data-script-runner-control
                      className={classes.formInput}
                      type="number"
                      value={newFields[field] ?? ""}
                      onChange={e => setField(field, e.target.value)}
                    />
                  </>
              )}
              {field === "maxNumber" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Максимальное число</label>
                    <input
                      data-script-runner-control
                      className={classes.formInput}
                      type="number"
                      value={newFields[field] ?? ""}
                      onChange={e => setField(field, e.target.value)}
                    />
                  </>
              )}
              {field === "minTime" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Не раньше времени</label>
                    <input
                      data-script-runner-control
                      className={classes.formInput}
                      type="time"
                      value={newFields[field] ?? ""}
                      onChange={e => setField(field, e.target.value)}
                    />
                  </>
              )}
              {field === "maxTime" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Не позже времени</label>
                    <input
                      data-script-runner-control
                      className={classes.formInput}
                      type="time"
                      value={newFields[field] ?? ""}
                      onChange={e => setField(field, e.target.value)}
                    />
                  </>
              )}
              {field === "minLength" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Мин. длина текста</label>
                    <input
                      data-script-runner-control
                      className={classes.formInput}
                      type="number"
                      min="1"
                      value={newFields[field] ?? "6"}
                      onChange={e => setField(field, e.target.value)}
                    />
                  </>
              )}
              {field === "maxLength" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Макс. длина текста</label>
                    <input
                      data-script-runner-control
                      className={classes.formInput}
                      type="number"
                      min="1"
                      value={newFields[field] ?? "12"}
                      onChange={e => setField(field, e.target.value)}
                    />
                  </>
              )}
              {field === "sourceActionIndex" && (
                newFields.dataSource === "reference" && (
                  <>
                    <label data-script-runner-control className={classes.formLabel}>Предыдущий шаг</label>
                    <select
                      data-script-runner-control
                      className={classes.formSelect}
                      value={newFields[field] ?? ""}
                      onChange={e => setField(field, e.target.value)}
                    >
                      <option value="">Выберите шаг</option>
                      {actions
                        .map((action, index) => ({ action, index }))
                        .filter(({ action }) => actionHasOutput(action))
                        .map(({ action, index }) => (
                          <option key={index} value={index}>
                            {index + 1}. {describe(action)}
                          </option>
                        ))}
                    </select>
                  </>
                )
              )}
              {field === "key" && (
                <>
                  <label data-script-runner-control className={classes.formLabel}>Клавиша</label>
                  <select data-script-runner-control className={classes.formSelect}
                    value={newFields[field] ?? "Enter"}
                    onChange={e => setField(field, e.target.value)}>
                    {KEY_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </>
              )}
              {field === "ms" && (
                <>
                  <label data-script-runner-control className={classes.formLabel}>Пауза (мс)</label>
                  <input data-script-runner-control className={classes.formInput}
                    type="number" min="0" placeholder="1000"
                    value={newFields[field] ?? ""}
                    onChange={e => setField(field, e.target.value)} />
                </>
              )}
              {field === "timeout" && (
                <>
                  <label data-script-runner-control className={classes.formLabel}>Таймаут (мс)</label>
                  <input data-script-runner-control className={classes.formInput}
                    type="number" min="0" placeholder="5000"
                    value={newFields[field] ?? ""}
                    onChange={e => setField(field, e.target.value)} />
                </>
              )}
              {field === "url" && (
                <>
                  <label data-script-runner-control className={classes.formLabel}>URL</label>
                  <input data-script-runner-control className={classes.formInput}
                    placeholder="https://..."
                    value={newFields[field] ?? ""}
                    onChange={e => setField(field, e.target.value)} />
                </>
              )}
              {(field === "x" || field === "y") && (
                <>
                  <label data-script-runner-control className={classes.formLabel}>Прокрутка {field.toUpperCase()}</label>
                  <input data-script-runner-control className={classes.formInput}
                    type="number" placeholder="0"
                    value={newFields[field] ?? ""}
                    onChange={e => setField(field, e.target.value)} />
                </>
              )}
            </div>
          ))}

          <button data-script-runner-control className={classes.primaryBtn} onClick={addAction}>
            <IconPlus /> Добавить действие
          </button>
        </div>
      </DraggableWindow>

      {/* ─── SCENARIO WINDOW ─── */}
      <DraggableWindow
        show={!!editingScriptId && showScenario} title={editingScriptName ? `Сценарий: ${editingScriptName}` : "Сценарий"} zIndex={zMap.scenario}
        onClose={() => setShowScenario(false)} onFocus={() => bringToFront("scenario")}
        defaultX={20} defaultY={80}
        defaultW={360} defaultH={420} minW={280} minH={200}
      >
        {actions.length === 0 ? (
          <div data-script-runner-control className={classes.emptyState}>
            <div data-script-runner-control className={classes.emptyIcon}><IconList /></div>
            <p data-script-runner-control className={classes.emptyText}>Сценарий пуст</p>
            <p data-script-runner-control className={classes.emptyHint}>Добавьте действия через окно «Действие»</p>
          </div>
        ) : (
          <div data-script-runner-control className={classes.scenarioList}>
            {actions.map((action, idx) => (
              <div key={idx} data-script-runner-control className={classes.actionItem}>
                <div data-script-runner-control className={classes.actionNum}>{idx + 1}</div>
                <div data-script-runner-control className={classes.actionContent}>
                  <div data-script-runner-control className={classes.actionType}>
                    {ACTION_TYPES[action.type]?.label}
                  </div>
                  <div data-script-runner-control className={classes.actionDesc}>{describe(action)}</div>
                </div>
                <div data-script-runner-control className={classes.actionControls}>
                  <button data-script-runner-control className={classes.iconBtn}
                    disabled={idx === 0} onClick={() => moveAction(idx, idx - 1)}>↑</button>
                  <button data-script-runner-control className={classes.iconBtn}
                    disabled={idx === actions.length - 1} onClick={() => moveAction(idx, idx + 1)}>↓</button>
                  <button data-script-runner-control className={`${classes.iconBtn} ${classes.iconBtnDel}`}
                    onClick={() => deleteAction(idx)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div data-script-runner-control className={classes.winFooter}>
          {isRunning ? (
            <button data-script-runner-control className={`${classes.primaryBtn} ${classes.primaryBtnRed}`}
              onClick={() => (stopRef.current = true)}>
              <IconStop /> Остановить
            </button>
          ) : (
            <button data-script-runner-control className={classes.primaryBtn}
              onClick={runScript} disabled={!actions.length}>
              <IconPlay /> Запустить
            </button>
          )}
          <button data-script-runner-control className={classes.secondaryBtn}
            onClick={() => { setActions([]); setReport(null); }}
            disabled={isRunning || !actions.length}>
            <IconTrash /> Очистить
          </button>
        </div>
      </DraggableWindow>

      {/* ─── SCRIPTS WINDOW ─── */}
      <DraggableWindow
        show={showScripts} title="Библиотека скриптов" zIndex={zMap.scripts}
        onClose={() => setShowScripts(false)} onFocus={() => bringToFront("scripts")}
        defaultX={20} defaultY={80}
        defaultW={700} defaultH={440} minW={280} minH={200}
      >
        <input
          ref={importInputRef}
          data-script-runner-control
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleImportFileChange}
        />
        <div data-script-runner-control className={classes.saveSection}>
          <div data-script-runner-control className={classes.saveLabel}>
            {createTargetParentId
              ? <>В группу: <span style={{ color: "#0057c3" }}>{findNodeById(scriptTree, createTargetParentId)?.name ?? ""}</span>
                <button data-script-runner-control className={classes.pickBannerBtn} style={{ marginLeft: 4, background: "#eef2fd", color: "#0057c3", fontSize: 10, padding: "1px 8px" }}
                  onClick={() => setCreateTargetParentId(null)}>✕ В корень</button>
              </>
              : "Новый элемент"
            }
          </div>
          <div data-script-runner-control className={classes.saveRow}>
            <input data-script-runner-control className={classes.formInput}
              placeholder="Название..."
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveScript()} />
            <button data-script-runner-control className={classes.primaryBtn}
              onClick={saveScript} disabled={!saveName.trim()}>
              <IconSave /> Скрипт
            </button>
            <button data-script-runner-control className={classes.secondaryBtn}
              onClick={saveFolder} disabled={!saveName.trim()}>
              <IconFolderPlus /> Группа
            </button>
          </div>
          <div data-script-runner-control className={classes.saveRow}>
            <button data-script-runner-control className={classes.secondaryBtn} onClick={exportLibrary}>
              <IconDownload /> Экспорт библиотеки
            </button>
            <button data-script-runner-control className={classes.secondaryBtn} onClick={triggerImport}>
              <IconUpload /> Импорт
            </button>
          </div>
          {scriptsNotice?.text && (
            <div data-script-runner-control className={classes.scriptMeta}
              style={{ marginTop: 8, color: scriptsNotice.type === "error" ? "#d9534f" : undefined }}>
              {scriptsNotice.text}
            </div>
          )}
        </div>

        <div data-script-runner-control className={classes.scriptsDivider} />

        {scriptTree.length === 0 ? (
          <div data-script-runner-control className={classes.emptyState}>
            <div data-script-runner-control className={classes.emptyIcon}><IconBook /></div>
            <p data-script-runner-control className={classes.emptyText}>Нет сохранённых скриптов</p>
          </div>
        ) : (
          <div data-script-runner-control className={classes.scriptsList}
            onDragLeave={handleDragLeaveList}
            onDrop={handleDrop}>
            {(function renderTree(nodes, depth) {
              return nodes.map((node) => {
                const isDragged = dragId === node.id;
                const dropBefore = dropInfo?.targetId === node.id && dropInfo?.position === "before";
                const dropAfter = dropInfo?.targetId === node.id && dropInfo?.position === "after";
                const dropInside = dropInfo?.targetId === node.id && dropInfo?.position === "inside";

                if (node.type === "folder") {
                  const scriptCount = collectScripts(node).length;
                  return (
                    <React.Fragment key={node.id}>
                      {dropBefore && <div data-script-runner-control className={classes.dropLine} style={{ marginLeft: depth * 20 }} />}
                      <div data-script-runner-control
                        className={`${classes.folderRow} ${isDragged ? classes.dragging : ""} ${dropInside ? classes.folderDropTarget : ""}`}
                        style={{ paddingLeft: depth * 20 }}
                        onDragOver={(e) => handleDragOver(e, node.id, "folder")}>
                        <span data-script-runner-control className={classes.gripHandle} draggable
                          onDragStart={(e) => handleDragStart(e, node.id)}
                          onDragEnd={handleDragEnd}>
                          <IconGrip />
                        </span>
                        <button data-script-runner-control className={classes.folderChevronBtn}
                          onClick={() => toggleCollapse(node.id)}>
                          <IconChevron open={!node.collapsed} />
                        </button>
                        <span data-script-runner-control className={classes.folderIcon}><IconFolder /></span>
                        {renamingNodeId === node.id ? (
                          <input data-script-runner-control className={classes.inlineRenameInput}
                            autoFocus
                            value={renamingValue}
                            onChange={(e) => setRenamingValue(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setRenamingNodeId(null); setRenamingValue(""); } }}
                          />
                        ) : (
                          <span data-script-runner-control className={classes.folderName}
                            onDoubleClick={() => startRename(node.id, node.name)}>
                            {node.name}
                          </span>
                        )}
                        <span data-script-runner-control className={classes.scriptMeta} style={{ marginTop: 0, marginLeft: 6 }}>
                          {scriptCount}
                        </span>
                        <div data-script-runner-control className={classes.folderActions}>
                          <button data-script-runner-control className={classes.iconBtn} title="Запустить все"
                            onClick={() => runFolderById(node.id)} disabled={!scriptCount || isRunning}>
                            <IconPlay />
                          </button>
                          <button data-script-runner-control className={`${classes.iconBtn} ${
                            visibleNodeId === node.id ? classes.iconBtnActive : ""
                          }`}
                            title={visibleNodeId === node.id ? "Скрыть точки" : "Показать точки"}
                            onClick={() => toggleNodePreview(node.id)}>
                            {visibleNodeId === node.id ? <IconEyeOff /> : <IconEye />}
                          </button>
                          <button data-script-runner-control className={classes.iconBtn} title="Создавать внутри"
                            onClick={() => setCreateTargetParentId((prev) => prev === node.id ? null : node.id)}
                            style={createTargetParentId === node.id ? { background: "#e8f0ff", borderColor: "#9db6f2", color: "#0057c3" } : undefined}>
                            <IconPlus />
                          </button>
                          <button data-script-runner-control className={classes.iconBtn} title="Экспортировать группу"
                            onClick={() => exportFolder(node.id)}>
                            <IconDownload />
                          </button>
                          <button data-script-runner-control className={`${classes.iconBtn} ${classes.iconBtnDel}`}
                            onClick={() => deleteNode(node.id)}>✕</button>
                        </div>
                      </div>
                      {dropAfter && !(!node.collapsed && node.children?.length) && <div data-script-runner-control className={classes.dropLine} style={{ marginLeft: depth * 20 }} />}
                      {!node.collapsed && node.children && node.children.length > 0 && renderTree(node.children, depth + 1)}
                    </React.Fragment>
                  );
                }
                const sc = node.actions ?? [];
                return (
                  <React.Fragment key={node.id}>
                    {dropBefore && <div data-script-runner-control className={classes.dropLine} style={{ marginLeft: depth * 20 }} />}
                    <div data-script-runner-control
                      className={`${classes.scriptCard} ${isDragged ? classes.dragging : ""}`}
                      style={{ marginLeft: depth * 20 }}
                      onDragOver={(e) => handleDragOver(e, node.id, "script")}>
                      <span data-script-runner-control className={classes.gripHandle} draggable
                        onDragStart={(e) => handleDragStart(e, node.id)}
                        onDragEnd={handleDragEnd}>
                        <IconGrip />
                      </span>
                      <div data-script-runner-control className={classes.scriptCardInfo}>
                        <div data-script-runner-control className={classes.scriptName}>
                          {renamingNodeId === node.id ? (
                            <input data-script-runner-control className={classes.inlineRenameInput}
                              autoFocus
                              value={renamingValue}
                              onChange={(e) => setRenamingValue(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setRenamingNodeId(null); setRenamingValue(""); } }}
                            />
                          ) : (
                            <span onDoubleClick={() => startRename(node.id, node.name)}>{node.name}</span>
                          )}
                          {editingScriptId === node.id && (
                            <span data-script-runner-control className={classes.scriptEditingBadge}>
                              редактируется
                            </span>
                          )}
                        </div>
                        <div data-script-runner-control className={classes.scriptMeta}>
                          {sc.length} {sc.length === 1 ? "действие" : sc.length < 5 ? "действия" : "действий"}
                        </div>
                      </div>
                      <div data-script-runner-control className={classes.scriptCardActions}>
                        <button data-script-runner-control className={classes.iconBtn}
                          onClick={() => runScriptById(node.id)}
                          title="Запустить"
                          disabled={!sc.length || isRunning}>
                          <IconPlay />
                        </button>
                        <button data-script-runner-control className={`${classes.iconBtn} ${
                          editingScriptId === node.id ? classes.iconBtnActive : ""
                        }`}
                          title="Редактировать"
                          onClick={() => editScript(node.id)}>
                          <IconEdit />
                        </button>
                        <button data-script-runner-control className={`${classes.iconBtn} ${
                          visibleNodeId === node.id ? classes.iconBtnActive : ""
                        }`}
                          title={visibleNodeId === node.id ? "Скрыть точки" : "Показать точки"}
                          onClick={() => toggleNodePreview(node.id)}>
                          {visibleNodeId === node.id ? <IconEyeOff /> : <IconEye />}
                        </button>
                      <button data-script-runner-control className={classes.iconBtn}
                        title="Экспортировать скрипт"
                          onClick={() => exportSingleScript(node.id)}>
                          <IconDownload />
                        </button>
                        <button data-script-runner-control className={`${classes.iconBtn} ${classes.iconBtnDel}`}
                          onClick={() => deleteNode(node.id)}>✕</button>
                      </div>
                    </div>
                    {dropAfter && <div data-script-runner-control className={classes.dropLine} style={{ marginLeft: depth * 20 }} />}
                  </React.Fragment>
                );
              });
            })(scriptTree, 0)}
          </div>
        )}

      </DraggableWindow>

      {/* ─── REPORT WINDOW ─── */}
      <DraggableWindow
        show={showReport && !!report} title="Отчёт выполнения" zIndex={zMap.report}
        onClose={() => setShowReport(false)} onFocus={() => bringToFront("report")}
        defaultX={20} defaultY={Math.max(0, vh - 400)}
        defaultW={400} defaultH={360} minW={300} minH={200}
      >
        {/* Summary */}
        <div data-script-runner-control
          className={`${classes.reportSummary} ${allOk ? classes.reportSummaryOk : classes.reportSummaryErr}`}>
          <div data-script-runner-control className={classes.reportSummaryMain}>
            <span data-script-runner-control className={classes.reportSummaryIcon}>{allOk ? "✓" : "✗"}</span>
            <span data-script-runner-control className={classes.reportSummaryText}>
              {allOk ? "Выполнено успешно" : okCount === 0 ? "Ошибка выполнения" : `Выполнено ${okCount} из ${totalCount}`}
            </span>
          </div>
          <div data-script-runner-control className={classes.reportSummaryMeta}>
            {okCount}/{totalCount} шагов · {totalMs} мс
          </div>
        </div>

        {/* Steps */}
        <div data-script-runner-control className={classes.reportSteps}>
          {report?.map(r => (
            <div key={r.index} data-script-runner-control
              className={`${classes.reportStep} ${
                r.status === "success" ? classes.stepOk : r.status === "stopped" ? classes.stepStop : classes.stepErr
              }`}>
              <div data-script-runner-control className={classes.stepIcon}>
                {r.status === "success" ? "✓" : r.status === "stopped" ? "⏹" : "✗"}
              </div>
              <div data-script-runner-control className={classes.stepBody}>
                <div data-script-runner-control className={classes.stepHeader}>
                  <span data-script-runner-control className={classes.stepNum}>Шаг {r.index + 1}</span>
                  <span data-script-runner-control className={classes.stepType}>{ACTION_TYPES[r.action.type]?.label}</span>
                  <span data-script-runner-control className={classes.stepDur}>{r.duration} мс</span>
                </div>
                <div data-script-runner-control className={classes.stepDesc}>{describe(r.action)}</div>
                {r.status !== "success" && (
                  <div data-script-runner-control className={classes.stepErr2}>{r.message}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DraggableWindow>
    </>,
    document.body
  );
}

export default ScriptRunner;
