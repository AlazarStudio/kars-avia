#!/usr/bin/env node
// Заливка публичных патч-нот на бэкенд через GraphQL-мутацию createPatchNote.
//
// Данные: ./patchNotes.data.mjs
// Запуск (Node >= 18):
//   KARS_TOKEN=<superadmin_jwt> node scripts/seedPatchNotes.mjs --dry-run
//   KARS_TOKEN=<superadmin_jwt> node scripts/seedPatchNotes.mjs --until 4.1.0
//   KARS_TOKEN=<superadmin_jwt> node scripts/seedPatchNotes.mjs
//
// Env:
//   KARS_GRAPHQL  — GraphQL endpoint (по умолчанию https://devbackend.karsavia.ru:443/graphql, из VITE_DEV_SERVER)
//   KARS_TOKEN    — JWT суперадмина (нужен для createPatchNote; getAllPatchNotes тоже требует авторизации)
//
// Флаги:
//   --dry-run        — ничего не создавать/не менять, только показать план
//   --until <ver>    — создавать только записи с версией <= указанной (напр. --until 4.1.0)
//   --reconcile      — привести уже залитые записи к текущей нумерации через updatePatchNote
//                      (переименование по RENAME_MAP; нужно, если раньше залили старую схему x.y.0)
//
// Идемпотентность: перед заливкой берётся список существующих name; совпадения пропускаются.

import patchNotes from "./patchNotes.data.mjs";

const ENDPOINT = process.env.KARS_GRAPHQL || "https://devbackend.karsavia.ru:443/graphql";
const TOKEN = process.env.KARS_TOKEN || "";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const RECONCILE = args.includes("--reconcile");
const untilIdx = args.indexOf("--until");
const UNTIL = untilIdx !== -1 ? args[untilIdx + 1] : null;

// Переименование ранее залитой старой схемы (x.y.0) в текущую нумерацию.
// Порядок важен: 3.3.0 → 3.2.1 идёт ДО 3.9.0 → 3.3.0, чтобы не было коллизии имени.
const RENAME_MAP = [
  { old: "3.3.0", next: "3.2.1" },
  { old: "3.4.0", next: "3.2.2" },
  { old: "3.5.0", next: "3.2.3" },
  { old: "3.6.0", next: "3.2.4" },
  { old: "3.7.0", next: "3.2.5" },
  { old: "3.8.0", next: "3.2.6" },
  { old: "3.9.0", next: "3.3.0" },
  { old: "4.2.0", next: "4.1.1" },
  { old: "4.3.0", next: "4.1.2" },
];

function parseVersion(v) {
  return String(v)
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
}

function cmpVersion(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok && !json.data) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

const GET_ALL = `query { getAllPatchNotes { name } }`;
const GET_ALL_IDS = `query { getAllPatchNotes { id name } }`;
const CREATE = `mutation ($data: PatchNoteInput!) {
  createPatchNote(data: $data) { id name }
}`;
const UPDATE = `mutation ($id: ID!, $data: PatchNoteUpdateInput!) {
  updatePatchNote(id: $id, data: $data) { id name }
}`;

async function reconcile() {
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Режим: RECONCILE${DRY_RUN ? " (DRY-RUN, без изменений)" : ""}`);

  const data = await gql(GET_ALL_IDS);
  const byName = new Map((data.getAllPatchNotes || []).map((p) => [p.name, p.id]));
  const notesByName = new Map(patchNotes.map((n) => [n.name, n]));

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const { old, next } of RENAME_MAP) {
    const id = byName.get(old);
    if (!id) {
      console.log(
        `↷ ${old} → ${next}: ${byName.has(next) ? "уже переименован" : "исходной записи нет"}, пропуск`
      );
      skipped++;
      continue;
    }
    const note = notesByName.get(next);
    if (!note) {
      console.error(`✖ ${old} → ${next}: нет данных для ${next} в data-файле`);
      errors++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`~ ${old} → ${next}: будет переименован (id ${id})`);
      byName.delete(old);
      byName.set(next, id);
      updated++;
      continue;
    }
    try {
      await gql(UPDATE, {
        id,
        data: { name: note.name, date: note.date, description: note.description },
      });
      console.log(`✔ ${old} → ${next} (id ${id})`);
      byName.delete(old);
      byName.set(next, id);
      updated++;
    } catch (e) {
      console.error(`✖ ${old} → ${next}: ${e.message}`);
      errors++;
    }
  }

  console.log(
    `\nИтог reconcile: ${DRY_RUN ? "к обновлению" : "обновлено"} ${updated}, пропущено ${skipped}, ошибок ${errors}.`
  );
  if (errors > 0) process.exit(1);
}

async function main() {
  if (untilIdx !== -1 && (!UNTIL || UNTIL.startsWith("--"))) {
    console.error("✖ Флаг --until требует версию, напр.: --until 4.1.0");
    process.exit(1);
  }
  if (!DRY_RUN && !TOKEN) {
    console.error(
      "✖ Нет KARS_TOKEN (JWT суперадмина). Пример: KARS_TOKEN=<jwt> node scripts/seedPatchNotes.mjs"
    );
    process.exit(1);
  }

  if (RECONCILE) {
    await reconcile();
    return;
  }

  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(
    `Режим: ${DRY_RUN ? "DRY-RUN (без создания)" : "СОЗДАНИЕ"}${
      UNTIL ? `, до версии ${UNTIL} включительно` : ""
    }`
  );

  // Список уже существующих записей (для идемпотентности). Требует авторизации.
  let existing = new Set();
  if (TOKEN) {
    try {
      const data = await gql(GET_ALL);
      existing = new Set((data.getAllPatchNotes || []).map((p) => p.name));
      console.log(`Уже на бэкенде: ${existing.size} записей.`);
    } catch (e) {
      console.error(`✖ Не удалось получить список патчей: ${e.message}`);
      process.exit(1);
    }
  } else {
    console.log("⚠ Без токена — пропуск проверки существующих (dry-run).");
  }

  const ordered = [...patchNotes].sort((a, b) => cmpVersion(a.name, b.name));
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const note of ordered) {
    if (UNTIL && cmpVersion(note.name, UNTIL) > 0) {
      console.log(`↷ ${note.name} — пропуск (> --until ${UNTIL})`);
      skipped++;
      continue;
    }
    if (existing.has(note.name)) {
      console.log(`↷ ${note.name} — пропуск (уже существует)`);
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`+ ${note.name} (${note.date.slice(0, 10)}) — будет создан`);
      created++;
      continue;
    }
    try {
      const data = await gql(CREATE, {
        data: { name: note.name, description: note.description, date: note.date },
      });
      console.log(`✔ ${note.name} — создан (id ${data.createPatchNote.id})`);
      created++;
    } catch (e) {
      console.error(`✖ ${note.name} — ошибка: ${e.message}`);
      errors++;
    }
  }

  console.log(
    `\nИтог: ${DRY_RUN ? "к созданию" : "создано"} ${created}, пропущено ${skipped}, ошибок ${errors}.`
  );
  if (errors > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
