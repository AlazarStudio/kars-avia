import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestDocumentation.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_DOCUMENTATION, getCookie } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import TextEditor from "../TextEditor/TextEditor";
import { FILTER_OPTIONS } from "../../../roles";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";

// ----- helpers -----
const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

const makeEmptyBlock = (defaultFilter = "") => ({
  id: newId(), // это же значение пойдёт в clientKey
  name: "",
  description: "",
  type: "documentation",
  filter: defaultFilter,
  images: [], // локально храним File[], НО не отправляем в data
  children: [],
});

// рекурсивно обновить узел по id
const updateTree = (nodes, id, updater) =>
  nodes.map((n) => {
    if (n.id === id) return updater(n);
    if (n.children?.length)
      return { ...n, children: updateTree(n.children, id, updater) };
    return n;
  });

// рекурсивно удалить узел по id
const removeFromTree = (nodes, id) =>
  nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.children?.length
        ? { ...n, children: removeFromTree(n.children, id) }
        : n
    );

// Сбор плоских групп файлов с ключами + «очистка» дерева для data
function buildPayload(rootKey, rootFiles, blocks) {
  const groups = [];

  // Корневые файлы: key = rootKey
  if (rootFiles?.length) groups.push({ key: rootKey, images: rootFiles });

  function strip(node) {
    if (node.images?.length) {
      groups.push({ key: node.id, images: node.images }); // key совпадает с clientKey
    }
    const children = (node.children || []).map(strip);
    return {
      name: node.name || "",
      description: node.description || "",
      type: node.type || "documentation",
      filter: node.filter,
      clientKey: node.id, // <-- важное поле для сопоставления на бэке
      children,
    };
  }

  return {
    dataChildren: blocks.map(strip),
    imageGroupsByKey: groups, // [{ key, images: File[] }]
  };
}

// ----- Рекурсивный редактор одного блока -----
function BlockItem({ node, filter, onChange, onAddChild, onRemove }) {
  const onFiles = (e) => {
    const max = 8 * 1024 * 1024;
    const list = Array.from(e.target.files || []);
    const valid = list.filter((f) => f.size <= max);
    if (valid.length !== list.length)
      alert("Некоторые файлы > 8MB были отброшены.");
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
        />
      </div>

      <div className={classes.blockItemRow}>
        <label>Описание блока</label>
        <TextEditor
          anotherDescription={node.description}
          isEditing={true}
          onChange={(val) => onChange({ ...node, description: val })}
        />
      </div>

      <div className={classes.blockItemRow}>
        {/* <label>Изображения (key: {node.id})</label> */}
        <input type="file" multiple accept="image/*" onChange={onFiles} />
        {!!node.images?.length && (
          <div className={classes.filesCount}>
            Выбрано файлов: {node.images.length}
          </div>
        )}
      </div>

      <div className={classes.blockItemActions}>
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
      </div>

      {!!node.children?.length && (
        <div className={classes.blockChildren}>
          {node.children.map((child) => (
            <BlockItem
              key={child.id}
              node={child}
              filter={child.filter}
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
                    makeEmptyBlock(child.filter || filter),
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

// ----- Основной компонент -----
function CreateRequestDocumentation({
  show,
  onClose,
  refetchDocumentation,
  addNotification,
}) {
  const token = getCookie("token");

  // корневой ключ (clientKey для верхнего узла)
  const [rootKey] = useState(newId());

  const [isEdited, setIsEdited] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "documentation",
    filter: "dispatcher",
    images: [], // File[] для корня (прикрепится к rootKey)
  });

  const [blocks, setBlocks] = useState([]); // BlockNode[]
  const sidebarRef = useRef(null);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      type: "documentation",
      filter: "dispatcher",
      images: [],
    });
    setBlocks([]);
    setIsEdited(false);
  }, []);

  const closeButton = useCallback(() => {
    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }
    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const fileInputRef = useRef(null);
  const handleRootFiles = (e) => {
    const max = 8 * 1024 * 1024;
    const list = Array.from(e.target.files || []);
    const valid = list.filter((f) => f.size <= max);
    if (valid.length !== list.length) {
      alert("Некоторые файлы > 8MB были отброшены.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setIsEdited(true);
    setFormData((prev) => ({ ...prev, images: valid }));
  };

  const [createDocumentation] = useMutation(CREATE_DOCUMENTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true", // если включена CSRF защита на сервере
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const changeNode = (id, nextNode) => {
    setIsEdited(true);
    setBlocks((prev) => updateTree(prev, id, () => nextNode));
  };

  const addChildTo = (id) => {
    setIsEdited(true);
    setBlocks((prev) =>
      updateTree(prev, id, (n) => ({
        ...n,
        children: [...(n.children || []), makeEmptyBlock(n.filter)],
      }))
    );
  };

  const removeNode = (id) => {
    setIsEdited(true);
    setBlocks((prev) => removeFromTree(prev, id));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };
    if (show) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);
// console.log(blocks);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name.trim() || !formData.description.trim()) {
      alert("Пожалуйста, заполните все поля!");
      setIsLoading(false);
      return;
    }

    try {
      // 1) собрать «чистых» детей и группы файлов по ключам
      const { dataChildren, imageGroupsByKey } = buildPayload(
        rootKey,
        formData.images,
        blocks
      );

      // console.log(dataChildren);
      // console.log(imageGroupsByKey);

      // 2) целиком data для мутации
      const data = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        filter: formData.filter,
        clientKey: rootKey, // ключ корня
        children: dataChildren, // дети уже без File[]
      };

      // 3) вызвать мутацию: data (чистый) + imageGroupsByKey (все File группами)
      const res = await createDocumentation({
        variables: {
          data,
          imageGroupsByKey,
        },
      });

      if (res) {
        refetchDocumentation && refetchDocumentation();
        resetForm();
        onClose();
        addNotification &&
          addNotification("Статья создана успешно.", "success");
      }
    } catch (err) {
      console.error("Ошибка при создании статьи:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentFilterLabel =
    FILTER_OPTIONS.find((o) => o.value === formData.filter)?.label ||
    FILTER_OPTIONS[0].label;


  // console.log(blocks);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить статью</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Название</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />

              <label>Категория</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Категория"}
                options={FILTER_OPTIONS.map((o) => o.label)}
                value={currentFilterLabel}
                onChange={(event, newValue) => {
                  const found =
                    FILTER_OPTIONS.find((o) => o.label === newValue) ||
                    FILTER_OPTIONS[0];
                  setIsEdited(true);
                  setFormData((prev) => ({ ...prev, filter: found.value }));
                }}
              />

              <label>Описание</label>
              <TextEditor
                anotherDescription={formData.description}
                isEditing={true}
                onChange={(newDescription) => {
                  setIsEdited(true);
                  setFormData((prev) => ({
                    ...prev,
                    description: newDescription,
                  }));
                }}
              />

              {/* <label>Картинки (корень, key: {rootKey})</label> */}
              <input
                type="file"
                name="images"
                multiple
                onChange={handleRootFiles}
                ref={fileInputRef}
              />
              {!!formData.images?.length && (
                <div className={classes.filesCount}>
                  Выбрано файлов: {formData.images.length}
                </div>
              )}

              <div className={classes.blocksHeader}>Блоки</div>
              {blocks.length === 0 && (
                <div className={classes.muted}>Пока нет блоков</div>
              )}

              <div className={classes.blocksList}>
                {blocks.map((b) => (
                  <BlockItem
                    key={b.id}
                    node={b}
                    filter={formData.filter}
                    onChange={(next) => changeNode(b.id, next)}
                    onAddChild={() => addChildTo(b.id)}
                    onRemove={() => removeNode(b.id)}
                  />
                ))}
              </div>

              <div className={classes.addBlockRow}>
                <Button
                  type="button"
                  onClick={() => {
                    setIsEdited(true);
                    setBlocks((prev) => [
                      ...prev,
                      makeEmptyBlock(formData.filter),
                    ]);
                  }}
                >
                  + Добавить блок
                </Button>
              </div>
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestDocumentation;

// import React, { useState, useRef, useEffect, useCallback } from "react";
// import classes from "./CreateRequestDocumentation.module.css";
// import Button from "../../Standart/Button/Button";
// import Sidebar from "../Sidebar/Sidebar";
// import {
//   CREATE_DOCUMENTATION,
//   CREATE_HOTEL,
//   CREATE_PATCH_NOTE,
//   getCookie,
// } from "../../../../graphQL_requests";
// import { useMutation } from "@apollo/client";
// import MUILoader from "../MUILoader/MUILoader";
// import TextEditor from "../TextEditor/TextEditor";

// // === вспомогалки для дерева ===
// const newId = () =>
//   typeof crypto !== "undefined" && crypto.randomUUID
//     ? crypto.randomUUID()
//     : String(Date.now() + Math.random());

// const makeEmptyBlock = () => ({
//   id: newId(),
//   name: "",
//   description: "",
//   type: "documentation",
//   images: [], // Array<File>
//   children: [], // Array<block>
// });

// // рекурсивно обновить узел по id
// const updateTree = (nodes, id, updater) =>
//   nodes.map((n) => {
//     if (n.id === id) return updater(n);
//     if (n.children?.length) {
//       return { ...n, children: updateTree(n.children, id, updater) };
//     }
//     return n;
//   });

// // рекурсивно удалить узел по id
// const removeFromTree = (nodes, id) =>
//   nodes
//     .filter((n) => n.id !== id)
//     .map((n) =>
//       n.children?.length
//         ? { ...n, children: removeFromTree(n.children, id) }
//         : n
//     );

// // сериализация в формат, ожидаемый беком
// const serialize = (node) => ({
//   name: node.name || "",
//   description: node.description || "",
//   type: "documentation",
//   images: node.images, // [File] — apollo-upload-client поднимет в multipart
//   children: node.children?.map(serialize) || [],
// });

// // === Рекурсивный редактор одного блока ===
// function BlockItem({ node, onChange, onAddChild, onRemove }) {
//   const onFiles = (e) => {
//     const max = 8 * 1024 * 1024; // 8MB
//     const list = Array.from(e.target.files || []);
//     const valid = list.filter((f) => f.size <= max);
//     if (valid.length !== list.length) {
//       alert("Некоторые файлы > 8MB были отброшены.");
//     }
//     onChange({ ...node, images: list });
//   };

//   return (
//     <div className={classes.blockItem}>
//       <div className={classes.blockItemRow}>
//         <label>Название блока</label>
//         <input
//           type="text"
//           value={node.name}
//           onChange={(e) => onChange({ ...node, name: e.target.value })}
//         />
//       </div>

//       <div className={classes.blockItemRow}>
//         <label>Описание блока</label>
//         <TextEditor
//           anotherDescription={node.description}
//           isEditing={true}
//           onChange={(val) => onChange({ ...node, description: val })}
//         />
//       </div>

//       <div className={classes.blockItemRow}>
//         <label>Изображения</label>
//         <input type="file" multiple name="images" onChange={onFiles} />
//         {node.images?.length > 0 && (
//           <div className={classes.filesCount}>
//             Выбрано файлов: {node.images.length}
//           </div>
//         )}
//       </div>

//       <div className={classes.blockItemActions}>
//         <Button type="button" onClick={onAddChild}>
//           Добавить подблок
//         </Button>
//         <Button
//           type="button"
//           onClick={onRemove}
//           style={{ background: "#e45757" }}
//         >
//           Удалить блок
//         </Button>
//       </div>

//       {/* Дети (вложенные блоки) */}
//       {node.children?.length > 0 && (
//         <div className={classes.blockChildren}>
//           {node.children.map((child) => (
//             <BlockItem
//               key={child.id}
//               node={child}
//               onChange={(updatedChild) => {
//                 const newChildren = node.children.map((c) =>
//                   c.id === updatedChild.id ? updatedChild : c
//                 );
//                 onChange({ ...node, children: newChildren });
//               }}
//               onAddChild={() => {
//                 onChange({
//                   ...node,
//                   children: [...node.children, makeEmptyBlock()],
//                 });
//               }}
//               onRemove={() => {
//                 onChange({
//                   ...node,
//                   children: node.children.filter((c) => c.id !== child.id),
//                 });
//               }}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function CreateRequestDocumentation({
//   show,
//   onClose,
//   refetchDocumentation,
//   addNotification,
// }) {
//   const token = getCookie("token");

//   const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     type: "documentation",
//   });

//   // НОВОЕ: состояние для корневых блоков
//   const [blocks, setBlocks] = useState([]); // Array<block>

//   const sidebarRef = useRef();

//   const resetForm = useCallback(() => {
//     setFormData({
//       name: "",
//       description: "",
//       type: "documentation",
//     });
//     setIsEdited(false); // Сброс флага изменений
//   }, []);

//   const closeButton = useCallback(() => {
//     if (!isEdited) {
//       resetForm();
//       onClose();
//       return;
//     }

//     if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
//       resetForm();
//       onClose();
//     }
//   }, [isEdited, resetForm, onClose]);

//   const handleChange = useCallback((e) => {
//     const { name, value } = e.target;
//     setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
//     setFormData((prevState) => ({
//       ...prevState,
//       [name]: value,
//     }));
//   }, []);

//   // const fileInputRef = useRef(null);

//   // const handleFileChange = (e) => {
//   //   const file = e.target.files[0];
//   //   const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
//   //   if (file.size > maxSizeInBytes) {
//   //     alert("Размер файла не должен превышать 8 МБ!");
//   //     setFormData((prevState) => ({
//   //       ...prevState,
//   //       images: "",
//   //     }));
//   //     if (fileInputRef.current) {
//   //       fileInputRef.current.value = ""; // Сброс значения в DOM-элементе
//   //     }
//   //     return;
//   //   }

//   //   if (file) {
//   //     setFormData((prevState) => ({
//   //       ...prevState,
//   //       images: file, // Сохраняем файл напрямую
//   //     }));
//   //   }
//   // };

//   const [uploadFile] = useMutation(CREATE_DOCUMENTATION, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Apollo-Require-Preflight": "true",
//       },
//     },
//   });

//   const [isLoading, setIsLoading] = useState(false);

//   console.log(blocks);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);

//     // Проверяем, заполнены ли все поля
//     if (!formData.name.trim() || !formData.description.trim()) {
//       alert("Пожалуйста, заполните все поля!");
//       setIsLoading(false);
//       return;
//     }

//     try {
//       let response_create_hotel = await uploadFile({
//         variables: {
//           data: {
//             name: formData.name,
//             description: formData.description,
//             type: formData.type,
//             children: blocks.map(serialize),
//           },
//         },
//       });

//       if (response_create_hotel) {
//         // addHotel(response_create_hotel.data.createHotel);
//         refetchDocumentation();
//         resetForm();
//         onClose();
//         addNotification("Патч создана успешно.", "success");
//       }
//     } catch (e) {
//       console.error("Ошибка при загрузке файла:", e);
//     } finally {
//       // resetForm();
//       // onClose();
//       setIsLoading(false);
//       onClose();
//       // addNotification("Гостиница создана успешно.", "success");
//     }
//   };

//   // useEffect(() => {
//   //   const handleClickOutside = (event) => {
//   //     if (
//   //       sidebarRef.current?.contains(event.target) // Клик в боковой панели
//   //     ) {
//   //       return; // Если клик внутри, ничего не делаем
//   //     }

//   //     closeButton();
//   //   };

//   //   if (show) {
//   //     document.addEventListener("mousedown", handleClickOutside);
//   //   } else {
//   //     document.removeEventListener("mousedown", handleClickOutside);
//   //   }

//   //   return () => {
//   //     document.removeEventListener("mousedown", handleClickOutside);
//   //   };
//   // }, [show, closeButton]);

//   // хелперы изменения дерева

//   const changeNode = (id, nextNode) => {
//     setIsEdited(true);
//     setBlocks((prev) => updateTree(prev, id, () => nextNode));
//   };

//   const addChildTo = (id) => {
//     setIsEdited(true);
//     setBlocks((prev) =>
//       updateTree(prev, id, (n) => ({
//         ...n,
//         children: [...(n.children || []), makeEmptyBlock()],
//       }))
//     );
//   };

//   const removeNode = (id) => {
//     setIsEdited(true);
//     setBlocks((prev) => removeFromTree(prev, id));
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//         closeButton();
//       }
//     };

//     if (show) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [show, closeButton]);

//   return (
//     <Sidebar show={show} sidebarRef={sidebarRef}>
//       <div className={classes.requestTitle}>
//         <div className={classes.requestTitle_name}>Добавить статью</div>
//         <div className={classes.requestTitle_close} onClick={closeButton}>
//           <img src="/close.png" alt="" />
//         </div>
//       </div>

//       {isLoading ? (
//         <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
//       ) : (
//         <>
//           <div className={classes.requestMiddle}>
//             <div className={classes.requestData}>
//               <label>Название</label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 placeholder=""
//                 onChange={handleChange}
//               />
//               {/* <label>Категория</label>
//               <input
//                 type="text"
//                 name="type"
//                 value={formData.type}
//                 placeholder=""
//                 onChange={handleChange}
//               /> */}
//               {/* <label>Подкатегория</label>
//               <input
//                 type="text"
//                 name="chapter"
//                 value={formData.chapter}
//                 placeholder=""
//                 onChange={handleChange}
//               /> */}
//               <label>Описание</label>
//               {/* <textarea
//                 id="description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//               ></textarea> */}
//               <TextEditor
//                 anotherDescription={formData.description}
//                 isEditing={true}
//                 onChange={(newDescription) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     description: newDescription,
//                   }))
//                 }
//               />

//               {/* НОВОЕ: редактор корневых блоков */}
//               <div className={classes.blocksHeader}>Блоки</div>
//               {blocks.length === 0 && (
//                 <div className={classes.muted}>Пока нет блоков</div>
//               )}

//               <div className={classes.blocksList}>
//                 {blocks.map((b) => (
//                   <BlockItem
//                     key={b.id}
//                     node={b}
//                     onChange={(next) => changeNode(b.id, next)}
//                     onAddChild={() => addChildTo(b.id)}
//                     onRemove={() => removeNode(b.id)}
//                   />
//                 ))}
//               </div>

//               <div className={classes.addBlockRow}>
//                 <Button
//                   type="button"
//                   onClick={() => {
//                     setIsEdited(true);
//                     setBlocks((prev) => [...prev, makeEmptyBlock()]);
//                   }}
//                 >
//                   + Добавить блок
//                 </Button>
//               </div>
//             </div>
//           </div>

//           <div className={classes.requestButton}>
//             <Button type="submit" onClick={handleSubmit}>
//               Добавить
//             </Button>
//           </div>
//         </>
//       )}
//     </Sidebar>
//   );
// }

// export default CreateRequestDocumentation;
