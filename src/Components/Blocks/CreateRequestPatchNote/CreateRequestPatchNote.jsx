import { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestPatchNote.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_PATCH_NOTE,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import TextEditor from "../TextEditor/TextEditor";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function CreateRequestPatchNote({ show, onClose, refetchPatchNotes }) {
  const token = getCookie("token");
  const { showAlert, confirm: confirmDialog } = useDialog();
  const { success, error: notifyError } = useToast();

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      date: "",
    });
    setIsEdited(false); // Сброс флага изменений
  }, []);

  const closeButton = useCallback(async () => {
    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }

    const ok = await confirmDialog(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (ok) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose, confirmDialog]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // const fileInputRef = useRef(null);

  // const handleFileChange = (e) => {
  //   const file = e.target.files[0];
  //   const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
  //   if (file.size > maxSizeInBytes) {
  //     alert("Размер файла не должен превышать 8 МБ!");
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       images: "",
  //     }));
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = ""; // Сброс значения в DOM-элементе
  //     }
  //     return;
  //   }

  //   if (file) {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       images: file, // Сохраняем файл напрямую
  //     }));
  //   }
  // };

  const [uploadFile] = useMutation(CREATE_PATCH_NOTE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Проверяем, заполнены ли все поля
    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.date
    ) {
      showAlert("Пожалуйста, заполните все поля!");
      setIsLoading(false);
      return;
    }

    try {
      const isoDate = new Date(formData.date).toISOString();
      const response_create_hotel = await uploadFile({
        variables: {
          data: {
            name: formData.name,
            description: formData.description,
            date: isoDate,
          },
        },
      });

      if (response_create_hotel) {
        refetchPatchNotes();
        resetForm();
        onClose();
        success("Патч успешно создан.");
      }
    } catch (e) {
      console.error("Ошибка при загрузке файла:", e);
      notifyError("Не удалось создать патч.");
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (
  //       sidebarRef.current?.contains(event.target) // Клик в боковой панели
  //     ) {
  //       return; // Если клик внутри, ничего не делаем
  //     }

  //     closeButton();
  //   };

  //   if (show) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   } else {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [show, closeButton]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, closeButton]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить патч</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <div className={classes.formHint}>
                Запись появится в общем списке патчей сразу после сохранения.
              </div>

              <div className={classes.fieldGroup}>
                <label>Название</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  placeholder="Например: Улучшили поиск по заявкам"
                  onChange={handleChange}
                />
              </div>

              <div className={classes.fieldGroup}>
                <label>Дата</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  placeholder="Дата"
                />
              </div>

              <div className={classes.fieldGroup}>
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

export default CreateRequestPatchNote;
