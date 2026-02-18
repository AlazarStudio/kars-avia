import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./EditRequestUpdates.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  GET_DOCUMENTATION_TREE,
  UPDATE_DOCUMENTATION,
  getCookie,
  server,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import TextEditor from "../TextEditor/TextEditor.jsx";
import TextEditorOutput from "../TextEditorOutput/TextEditorOutput.jsx";

/* ============================== helpers ============================== */

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

/** Приводим серверный узел к формату, удобному для формы */
const toLocalNode = (node = {}) => ({
  id: node.clientKey || node.id || newId(), // ключ для сопоставления файлов
  name: node.name || "",
  description: node.description || "",
  type: node.type || "update",
  existingImages: Array.isArray(node.images) ? node.images.slice() : [], // URL-ы с бэка
  images: [], // новые File[]
  children: Array.isArray(node.children) ? node.children.map(toLocalNode) : [],
});

/** Чистим локальный узел до структуры DocumentationUpdateInput */
const stripNode = (local) => ({
  clientKey: local.id,
  name: local.name || "",
  description: local.description || "",
  type: local.type || "update",
  children: (local.children || []).map(stripNode),
});

/** Рекурсивная сборка групп файлов для imageGroupsByKey */
const collectImageGroups = (node, groups) => {
  if (node.images && node.images.length) {
    groups.push({ key: node.id, images: node.images });
  }
  (node.children || []).forEach((c) => collectImageGroups(c, groups));
};

/** Рекурсивные утилиты изменения дерева */
const updateTreeById = (nodes, id, updater) =>
  nodes.map((n) => {
    if (n.id === id) return updater(n);
    if (n.children?.length)
      return { ...n, children: updateTreeById(n.children, id, updater) };
    return n;
  });

const removeFromTreeById = (nodes, id) =>
  nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.children?.length
        ? { ...n, children: removeFromTreeById(n.children, id) }
        : n
    );

/* =========================== BlockItem (recursive) =========================== */

function BlockItem({ node, disabled, onChange, onAddChild, onRemove }) {
  const onFiles = (e) => {
    const max = 8 * 1024 * 1024;
    const list = Array.from(e.target.files || []);
    const valid = list.filter((f) => f.size <= max);
    if (valid.length !== list.length) {
      alert("Некоторые файлы > 8MB были отброшены.");
    }
    onChange({ ...node, images: valid });
  };

  return (
    <div className={classes.blockItem}>
      <div className={classes.blockItemRow}>
        <label>Название блока</label>
        <input
          type="text"
          value={node.name}
          onChange={(e) => onChange({ ...node, name: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className={classes.blockItemRow}>
        <label>Описание блока</label>
        {disabled ? (
          // <div
          //   className={classes.descriptionPreview}
          //   dangerouslySetInnerHTML={{ __html: node.description || "" }}
          // />
          <TextEditorOutput description={node.description || ""} />
        ) : (
          <TextEditor
            anotherDescription={node.description}
            isEditing={true}
            onChange={(val) => onChange({ ...node, description: val })}
          />
        )}
      </div>

      {/* Превью существующих изображений (только просмотр, удаление не шлём, т.к. в сигнатуре нет параметра для удаления URL-ов) */}
      {!!node.existingImages?.length && (
        <div className={classes.files}>
          {node.existingImages.map((url, i) => (
            <div key={`${url}-${i}`} className={classes.thumb}>
              <img src={`${server}${url}`} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* Новые изображения для узла */}
      {!disabled && (
        <div className={classes.blockItemRow}>
          <label>Добавить изображения (key: {node.id})</label>
          <input type="file" multiple accept="image/*" onChange={onFiles} />
          {!!node.images?.length && (
            <div className={classes.filesCount}>
              Новых файлов: {node.images.length}
            </div>
          )}
        </div>
      )}

      <div className={classes.blockItemActions}>
        {!disabled && (
          <>
            <Button type="button" onClick={onAddChild}>
              Добавить подблок
            </Button>
            <Button
              type="button"
              onClick={onRemove}
              style={{ background: "#e45757" }}
            >
              Удалить блок
            </Button>
          </>
        )}
      </div>

      {!!node.children?.length && (
        <div className={classes.blockChildren}>
          {node.children.map((child) => (
            <BlockItem
              key={child.id}
              node={child}
              disabled={disabled}
              onChange={(updatedChild) => {
                const newChildren = node.children.map((c) =>
                  c.id === updatedChild.id ? updatedChild : c
                );
                onChange({ ...node, children: newChildren });
              }}
              onAddChild={() =>
                onChange({
                  ...node,
                  children: [
                    ...node.children,
                    {
                      id: newId(),
                      name: "",
                      description: "",
                      type: "update",
                      existingImages: [],
                      images: [],
                      children: [],
                    },
                  ],
                })
              }
              onRemove={() =>
                onChange({
                  ...node,
                  children: node.children.filter((c) => c.id !== child.id),
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =============================== Main component =============================== */

function EditRequestUpdates({
  show,
  onClose,
  DocumentationId, // id корня дерева
  refetchDocumentation,
  addNotification,
}) {
  const token = getCookie("token");
  const sidebarRef = useRef();

  const [root, setRoot] = useState(null); // локальное дерево
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prune, setPrune] = useState(false); // управляет pruneMissingChildren

  // Загружаем всё дерево
  const { loading, error, data } = useQuery(GET_DOCUMENTATION_TREE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { documentationTreeId: DocumentationId },
    skip: !DocumentationId || !show,
    fetchPolicy: "network-only",
  });

  // Инициализируем локальное дерево
  useEffect(() => {
    if (show && data?.documentationTree) {
      setRoot(toLocalNode(data.documentationTree));
      setIsEditing(false);
    }
  }, [show, data]);

  const [updateDocumentation] = useMutation(UPDATE_DOCUMENTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const closeButton = () => {
    const ok = confirm(
      "Вы уверены? Все несохранённые изменения будут потеряны."
    );
    if (ok) {
      onClose();
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  const setRootField = (name, value) =>
    setRoot((p) => ({ ...p, [name]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!root) return;

    setIsSaving(true);
    try {
      // 1) Чистые данные для $data
      const dataPayload = stripNode(root);

      // 2) Все новые файлы, сгруппированные по clientKey
      const imageGroupsByKey = [];
      collectImageGroups(root, imageGroupsByKey);

      // console.log(imageGroupsByKey);
      // console.log(dataPayload);

      // 3) Вызов мутации
      await updateDocumentation({
        variables: {
          updateDocumentationId: DocumentationId,
          data: dataPayload,
          // imageGroupsByKey, // [{ key, images: File[] }]
          // pruneMissingChildren: prune, // Boolean
        },
      });

      refetchDocumentation && refetchDocumentation();
      addNotification && addNotification("Документация обновлена.", "success");
      setIsEditing(false);
      onClose();
    } catch (err) {
      console.error("Ошибка при сохранении:", err);
      addNotification && addNotification("Ошибка при сохранении.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать статью</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="close" />
        </div>
      </div>

      {loading || isSaving ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : error ? (
        <div className={classes.error}>
          Ошибка: {String(error.message || error)}
        </div>
      ) : !root ? null : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              {/* Корневые поля */}
              <label>Название статьи</label>
              <input
                type="text"
                name="name"
                value={root.name}
                onChange={(e) => setRootField("name", e.target.value)}
                disabled={!isEditing}
              />

              <label>Описание</label>
              {isEditing ? (
                <TextEditor
                  anotherDescription={root.description}
                  isEditing={true}
                  onChange={(val) => setRootField("description", val)}
                />
              ) : (
                // <div
                //   className={classes.descriptionPreview}
                //   dangerouslySetInnerHTML={{ __html: root.description || "" }}
                // />
                <TextEditorOutput description={root.description || ""} />
              )}

              {/* Превью существующих изображений корня */}
              {!!root.existingImages?.length && (
                <div className={classes.files}>
                  {root.existingImages.map((url, i) => (
                    <div key={`${url}-${i}`} className={classes.thumb}>
                      <img src={`${server}${url}`} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}

              {/* Новые файлы для корня */}
              {isEditing && (
                <>
                  <label>Добавить изображения (root key: {root.id})</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const max = 8 * 1024 * 1024;
                      const list = Array.from(e.target.files || []);
                      const valid = list.filter((f) => f.size <= max);
                      if (valid.length !== list.length)
                        alert("Некоторые файлы > 8MB были отброшены.");
                      setRoot((p) => ({ ...p, images: valid }));
                    }}
                    disabled={!isEditing}
                  />
                  {!!root.images?.length && (
                    <div className={classes.filesCount}>
                      Новых файлов: {root.images.length}
                    </div>
                  )}
                </>
              )}

              {/* Дерево блоков */}
              <div className={classes.blocksHeader}>Блоки</div>

              {root.children.length === 0 && (
                <div className={classes.muted}>Нет подблоков</div>
              )}

              <div className={classes.blocksList}>
                {root.children.map((n) => (
                  <BlockItem
                    key={n.id}
                    node={n}
                    disabled={!isEditing}
                    onChange={(next) =>
                      setRoot(
                        (prev) => updateTreeById([prev], n.id, () => next)[0]
                      )
                    }
                    onAddChild={() =>
                      setRoot(
                        (prev) =>
                          updateTreeById([prev], n.id, (x) => ({
                            ...x,
                            children: [
                              ...(x.children || []),
                              {
                                id: newId(),
                                name: "",
                                description: "",
                                type: "update",
                                existingImages: [],
                                images: [],
                                children: [],
                              },
                            ],
                          }))[0]
                      )
                    }
                    onRemove={() =>
                      setRoot((prev) => removeFromTreeById([prev], n.id)[0])
                    }
                  />
                ))}
              </div>

              {isEditing && (
                <div className={classes.addBlockRow}>
                  <Button
                    type="button"
                    onClick={() =>
                      setRoot((p) => ({
                        ...p,
                        children: [
                          ...p.children,
                          {
                            id: newId(),
                            name: "",
                            description: "",
                            type: "update",
                            existingImages: [],
                            images: [],
                            children: [],
                          },
                        ],
                      }))
                    }
                  >
                    + Добавить блок верхнего уровня
                  </Button>
                </div>
              )}

              {isEditing && (
                <label className={classes.inlineToggle}>
                  <input
                    type="checkbox"
                    checked={prune}
                    onChange={(e) => setPrune(e.target.checked)}
                  />{" "}
                  Удалять отсутствующие узлы (pruneMissingChildren)
                </label>
              )}
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button
              type="submit"
              onClick={(e) => (isEditing ? handleSave(e) : setIsEditing(true))}
              backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
              color={!isEditing ? "#3B6C54" : "#fff"}
            >
              {isEditing ? (
                <>
                  Сохранить <img src="/saveDispatcher.png" alt="" />
                </>
              ) : (
                <>
                  Изменить <img src="/editDispetcher.png" alt="" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestUpdates;
