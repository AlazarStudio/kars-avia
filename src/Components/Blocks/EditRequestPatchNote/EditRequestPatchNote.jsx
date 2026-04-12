import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestPatchNote.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  GET_PATCH_NOTE,
  getCookie,
  UPDATE_PATCH_NOTE,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import TextEditor from "../TextEditor/TextEditor.jsx";
import { roles } from "../../../roles.js";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

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

  const [formData, setFormData] = useState();

  const sidebarRef = useRef();

  const { loading, error, data } = useQuery(GET_PATCH_NOTE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { getPatchNoteId: patchNoteId },
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
      onClose();
      setIsEditing(false);
      return;
    }

    const ok = await confirmDialog(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (ok) {
      onClose();
      setIsEditing(false);
      setIsEdited(false);
    }
  }, [isEdited, confirmDialog, onClose]);

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
          <img src="/close.png" alt="close" />
        </div>
      </div>

      {isLoading || loading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Название</label>
              <input
                type="text"
                name="name"
                value={formData?.name || ""}
                onChange={handleChange}
                placeholder=""
                disabled={!isEditing}
              />

              <label>Дата</label>
              <input
                type="date"
                name="date"
                value={patchDate || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Дата"
              />

              <label>Описание</label>
              {/* <textarea
                id="description"
                name="description"
                value={formData?.description || ""}
                onChange={handleChange}
                disabled={!isEditing}
              ></textarea> */}
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
          </div>
          {user.role !== roles.superAdmin ? null : (
            <div className={classes.requestButton}>
              <Button
                type="submit"
                onClick={handleSubmit}
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
          )}
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestPatchNote;
