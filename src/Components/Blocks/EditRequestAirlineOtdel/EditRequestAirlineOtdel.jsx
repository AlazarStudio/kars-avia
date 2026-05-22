import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestAirlineOtdel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_AIRLINE_DEPARTMERT,
  decodeJWT,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function EditRequestAirlineOtdel({
  show,
  onClose,
  id,
  category,
  positions, // Все доступные должности
  onSubmit,
  initialEditMode = false,
}) {
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  // const [userRole, setUserRole] = useState();
  const token = getCookie("token");

  // useEffect(() => {
  //   setUserRole(decodeJWT(token).role);
  // }, [token]);

  const [isEdited, setIsEdited] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (show) setIsEditing(initialEditMode);
  }, [show]);

  const [formData, setFormData] = useState({
    type: category?.name || "",
    email: category?.email || "",
  });

  // Инициализируем выбранные должности из category?.position (если они есть)
  // const [selectedPositions, setSelectedPositions] = useState(
  //   category && category.position ? category.position.map((pos) => pos.id) : []
  // );

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (show && category) {
      setFormData({ type: category.name, email: category.email || "" });
      // setSelectedPositions(
      //   category.position ? category.position.map((pos) => pos.id) : []
      // );
    }
  }, [show, category]);

  const resetForm = useCallback(() => {
    setFormData({
      type: category?.name || "",
      email: category?.email || "",
    });
    // setSelectedPositions(
    //   category && category.position ? category.position.map((pos) => pos.id) : []
    // );
    setIsEdited(false);
  }, [category]);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => setIsEditing(true);
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    setAnchorEl(null);
    if (!isEdited) {
      resetForm();
      onClose();
      setIsEditing(false);
      return;
    }
    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
      setIsEditing(false);
    }
  }, [isEdited, resetForm, onClose, confirm, isDialogOpen]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // Обработка переключения чекбоксов для должностей
  // const handlePositionToggle = (id) => {
  //   setIsEdited(true);
  //   setSelectedPositions((prevSelected) => {
  //     if (prevSelected.includes(id)) {
  //       return prevSelected.filter((posId) => posId !== id);
  //     } else {
  //       return [...prevSelected, id];
  //     }
  //   });
  // };

  const [createAirlineDepartment] = useMutation(CREATE_AIRLINE_DEPARTMERT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  // console.log(category?.id);
  // console.log(formData.type);
  // console.log(selectedPositions);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showAlert("Введите корректный email.");
        setIsLoading(false);
        return;
      }
    }

    try {
      let request = await createAirlineDepartment({
        variables: {
          updateAirlineId: id,
          input: {
            department: [
              {
                id: category.id,
                name: formData.type,
                email: formData.email || null,
                // positionIds: selectedPositions, // Передаём выбранные id должностей
              },
            ],
          },
        },
      });

      // console.log(request);

      if (request) {
        const sortedDepartments = request.data.updateAirline.department
          .map((department) => ({
            ...department,
            users: department.users.sort((a, b) =>
              a.name.localeCompare(b.name)
            ),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        onSubmit(sortedDepartments);
        resetForm();
        setIsEditing(false);
        success("Редактирование отдела прошло успешно.");
      }
    } catch (err) {
      notifyError("Произошла ошибка при сохранении данных");
      console.error(err);
    } finally {
      setIsEditing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;

      if (anchorEl && menuRef.current?.contains(event.target)) {
        setAnchorEl(null);
        return;
      }
      if (sidebarRef.current?.contains(event.target)) {
        return;
      }
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, closeButton, anchorEl, isDialogOpen]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить отдел</div>
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
          />
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Название отдела</label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Пример: Отдел продаж"
                disabled={!isEditing}
              />
              <label>Почта</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mail.ru"
                disabled={!isEditing}
              />
              {/* <div className={classes.positionsContainer}>
                <label>Должности:</label>
                {positions &&
                  positions?.map((position) => (
                    <div key={position.id} className={classes.checkboxItem}>
                      <input
                        type="checkbox"
                        id={`position-${position.id}`}
                        value={position.id}
                        checked={selectedPositions.includes(position.id)}
                        onChange={() => handlePositionToggle(position.id)}
                      />
                      <label htmlFor={`position-${position.id}`}>
                        {position.name}
                      </label>
                    </div>
                  ))}
              </div> */}
            </div>
          </div>
          {isEditing && (
            <div className={classes.requestButton}>
              <Button
                onClick={handleCancelEdit}
                backgroundcolor="var(--hover-gray)"
                color="#000"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                backgroundcolor="#0057C3"
                color="#fff"
              >
                Сохранить <img src="/saveDispatcher.png" alt="" />
              </Button>
            </div>
          )}
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestAirlineOtdel;
