import React, { useState, useRef, useEffect } from "react";
import classes from "./EditRequestUpdates.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  GET_DOCUMENTATION,
  getCookie,
  UPDATE_DOCUMENTATION,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";

function EditRequestUpdates({
  show,
  onClose,
  DocumentationId,
  refetchDocumentation,
  addNotification,
}) {
  const token = getCookie("token");

  const [formData, setFormData] = useState();

  const sidebarRef = useRef();

  const { loading, error, data } = useQuery(GET_DOCUMENTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { getDocumentationId: DocumentationId },
  });

  const [updatePatchNote] = useMutation(UPDATE_DOCUMENTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // "Apollo-Require-Preflight": "true",
      },
    },
  });

  useEffect(() => {
    if (show && data) {
      setFormData(data?.getDocumentation);
    }
  }, [show, data]);

  const [isEditing, setIsEditing] = useState(false);

  const closeButton = () => {
    let success = confirm("Вы уверены, все несохраненные данные будут удалены");
    if (success) {
      onClose();
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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
        let response_update_tarif = await updatePatchNote({
          variables: {
            updateDocumentationId: DocumentationId,
            data: {
              name: formData.name,
              description: formData.description,
            },
          },
        });
        refetchDocumentation();
        onClose();
        setIsLoading(false);
        addNotification("Редактирование патча прошло успешно.", "success");
      } catch (error) {
        setIsLoading(false);
        console.error("Произошла ошибка при выполнении запроса:", error);
        alert("Произошло ошибка при редактировании патча.");
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
  }, [show]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать статью</div>
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
              <label>Название тарифа</label>
              <input
                type="text"
                name="name"
                value={formData?.name || ""}
                onChange={handleChange}
                placeholder=""
                disabled={!isEditing}
              />
              <label>Описание</label>
              <textarea
                id="description"
                name="description"
                value={formData?.description || ""}
                onChange={handleChange}
                disabled={!isEditing}
              ></textarea>
            </div>
          </div>

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
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestUpdates;
