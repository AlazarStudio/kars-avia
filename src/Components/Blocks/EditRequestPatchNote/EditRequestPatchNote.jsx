import { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestPatchNote.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  GET_PATCH_NOTE,
  convertToDate,
  getCookie,
  UPDATE_PATCH_NOTE,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import TextEditor from "../TextEditor/TextEditor.jsx";
import { roles } from "../../../roles.js";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import useRequiredFields from "../../../hooks/useRequiredFields.js";

function EditRequestPatchNote({
  show,
  onClose,
  user,
  patchNoteId,
  refetchPatchNotes,
}) {
  const token = getCookie("token");
  const { confirm: confirmDialog } = useDialog();
  const { success, error: notifyError } = useToast();
  const canEdit = user.role === roles.superAdmin;

  const [formData, setFormData] = useState();

  const sidebarRef = useRef();
  const formBodyRef = useRef(null);

  const requiredKeys = ["name", "date", "description"];
  const requiredValues = {
    ...formData,
    description: (formData?.description || "").replace(/<[^>]*>/g, "").trim()
      ? formData.description
      : "",
  };
  const {
    invalid,
    validate,
    reset: resetRequired,
  } = useRequiredFields(requiredValues, requiredKeys, formBodyRef);
  const invalidNow = (key) => isEditing && invalid(key);

  const { loading, error, data } = useQuery(GET_PATCH_NOTE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { getPatchNoteId: patchNoteId },
    skip: !patchNoteId,
  });

  const [updatePatchNote] = useMutation(UPDATE_PATCH_NOTE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    if (show && data) {
      setFormData(data?.getPatchNote);
      setIsEdited(false);
    }
  }, [show, data]);

  const [isEditing, setIsEditing] = useState(false);

  const closeButton = useCallback(async () => {
    if (!isEdited) {
      resetRequired();
      onClose();
      setIsEditing(false);
      return;
    }

    const ok = await confirmDialog(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (ok) {
      resetRequired();
      onClose();
      setIsEditing(false);
      setIsEdited(false);
    }
  }, [isEdited, confirmDialog, onClose, resetRequired]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (isEditing) setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (isEditing) {
      e.preventDefault();
      setIsLoading(true);

      if (!validate()) {
        setIsLoading(false);
        return;
      }

      try {
        const isoDate = new Date(formData.date).toISOString();
        await updatePatchNote({
          variables: {
            updatePatchNoteId: patchNoteId,
            data: {
              name: formData.name,
              description: formData.description,
              date: isoDate,
            },
          },
        });
        refetchPatchNotes();
        setIsEdited(false);
        resetRequired();
        onClose();
        setIsLoading(false);
        success("Редактирование патча прошло успешно.");
      } catch (error) {
        setIsLoading(false);
        console.error("Произошла ошибка при выполнении запроса:", error);
        notifyError("Произошла ошибка при редактировании патча.");
      }
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    if (show) {
      const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          closeButton();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [show, closeButton]);

  const patchDate = formData?.date?.split("T")[0];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать патч</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading || loading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : error ? (
        <div className={classes.requestMiddle}>
          <div className={classes.requestData}>
            <div className={classes.formHint}>
              Не удалось загрузить патч. Попробуйте открыть запись ещё раз.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={classes.requestMiddle} ref={formBodyRef}>
            <div className={classes.requestData}>
              {isEditing && (
                <span className={classes.hint}>* — обязательные поля</span>
              )}
              {canEdit && isEditing && (
                <div className={classes.formHint}>
                  После сохранения изменения сразу появятся в ленте Patch Notes.
                </div>
              )}

              {isEditing ? (
                <>
                  <div className={classes.fieldGroup}>
                    <label
                      className={`${classes.required} ${invalidNow("name") ? "fieldInvalid" : ""}`}
                    >
                      Название
                    </label>
                    <input
                      type="text"
                      name="name"
                      className={invalidNow("name") ? "inputInvalid" : undefined}
                      value={formData?.name || ""}
                      onChange={handleChange}
                      placeholder=""
                      disabled={!isEditing}
                    />
                  </div>

                  <div className={classes.fieldGroup}>
                    <label
                      className={`${classes.required} ${invalidNow("date") ? "fieldInvalid" : ""}`}
                    >
                      Дата
                    </label>
                    <input
                      type="date"
                      name="date"
                      className={invalidNow("date") ? "inputInvalid" : undefined}
                      value={patchDate || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Дата"
                    />
                  </div>

                  <div className={classes.fieldGroup}>
                    <label
                      className={`${classes.required} ${invalidNow("description") ? "fieldInvalid" : ""}`}
                    >
                      Описание
                    </label>
                    <TextEditor
                      anotherDescription={formData?.description || ""}
                      isEditing={isEditing}
                      onChange={(newDescription) => {
                        if (isEditing) setIsEdited(true);
                        setFormData((prev) => ({
                          ...prev,
                          description: newDescription,
                        }));
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={classes.previewMetaGrid}>
                    <div className={classes.previewMetaCard}>
                      <div className={classes.previewMetaLabel}>Версия</div>
                      <div className={classes.previewMetaValue}>
                        {formData?.name || "Без названия"}
                      </div>
                    </div>
                    <div className={classes.previewMetaCard}>
                      <div className={classes.previewMetaLabel}>Дата</div>
                      <div className={classes.previewMetaValue}>
                        {formData?.date
                          ? convertToDate(formData.date, false)
                          : "Дата не указана"}
                      </div>
                    </div>
                  </div>

                  <div className={classes.previewArticle}>
                    <div className={classes.previewArticleLabel}>Описание</div>
                    <div
                      className={classes.previewArticleContent}
                      dangerouslySetInnerHTML={{
                        __html: formData?.description || "<p>Описание отсутствует.</p>",
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          {canEdit ? (
            <div className={classes.requestButton}>
              <Button
                type="submit"
                onClick={handleSubmit}
                backgroundcolor="#0057C3"
                color="#fff"
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
          ) : null}
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestPatchNote;
