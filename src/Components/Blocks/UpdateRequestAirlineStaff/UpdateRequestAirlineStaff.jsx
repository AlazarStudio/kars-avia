import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./UpdateRequestAirlineStaff.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  getCookie,
  UPDATE_AIRLINE_STAFF,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import { InputMask } from "@react-input/mask";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { roles } from "../../../roles";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";

function UpdateRequestAirlineStaff({
  show,
  onClose,
  id,
  refetch,
  user,
  accessMenu,
  selectedStaff,
  setAddTarif,
  setShowDelete,
  setDeleteIndex,
  positions,
}) {
  const { confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  // const [userRole, setUserRole] = useState();
  const token = getCookie("token");
  const [isEditing, setIsEditing] = useState(false);

  // useEffect(() => {
  //   setUserRole(decodeJWT(token).role);
  // }, [token]);

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    id: selectedStaff?.id || "",
    name: selectedStaff?.name || "",
    number: selectedStaff?.number || "",
    position: selectedStaff?.position?.name || "",
    gender: selectedStaff?.gender || "",
  });

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (show && selectedStaff) {
      setFormData({
        id: selectedStaff.id,
        name: selectedStaff.name,
        number: selectedStaff.number,
        position: selectedStaff?.position?.name || "",
        gender: selectedStaff.gender,
      });
    }
  }, [show, selectedStaff]);

  const resetForm = useCallback(() => {
    setFormData({
      id: selectedStaff?.id || "",
      name: selectedStaff?.name || "",
      number: selectedStaff?.number || "",
      position: selectedStaff?.position?.name || "",
      gender: selectedStaff?.gender || "",
    });
    setIsEdited(false); // Сброс флага изменений
    setIsEditing(false);
  }, []);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
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
      return;
    }

    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
    }
  }, [confirm, isDialogOpen, isEdited, onClose, resetForm]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const [updateAirlineStaff] = useMutation(UPDATE_AIRLINE_STAFF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const selectedPosition = positions.find(
        (position) => position.name === formData.position
      );
      let request = await updateAirlineStaff({
        variables: {
          updateAirlineId: id,
          input: {
            staff: [
              {
                id: formData.id,
                name: formData.name,
                number: formData.number,
                positionId: selectedPosition?.id,
                gender: formData.gender,
              },
            ],
          },
        },
      });

      if (request) {
        setAddTarif((prev) =>
          prev.map((s) =>
            s.id === formData.id
              ? { ...s, name: formData.name, number: formData.number, position: selectedPosition, gender: formData.gender }
              : s
          )
        );
        resetForm();
        onClose();
        setIsLoading(false);
        success("Редактирование прошло успешно.");
      }
    } catch (err) {
      setIsLoading(false);
      notifyError("Произошла ошибка при сохранении данных");
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

  // let positions = [
  //   "КАЭ (Капитан Эскадрильи)",
  //   "КВС (Командир воздушного судна)",
  //   "ВП (Второй пилот)",
  //   "СПБ (Старший бортпроводник)",
  //   "ИБП (Инструктор-бортпроводник)",
  //   "БП (бортпроводник)",
  //   "СА (сотрудник авиакомпании) ",
  //   "Зам. Дир. (заместитель директора)",
  //   "Инженер",
  // ];

  // let positions = [
  //   "КАЭ",
  //   "КВС",
  //   "ВП",
  //   "СБ",
  //   "ИБП",
  //   "БП",
  //   "СА",
  //   "Зам. Дир.",
  //   "Инженер",
  // ];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить сотрудника</div>
        <div className={classes.requestTitle_close}>
          {(user?.role !== roles.superAdmin && accessMenu?.personalUpdate) && (
            <AdditionalMenu
              anchorEl={anchorEl}
              onOpen={handleMenuOpen}
              onClose={handleMenuClose}
              menuRef={menuRef}
              onEdit={handleEditFromMenu}
              onDelete={() => {
                setDeleteIndex(selectedStaff);
                setShowDelete(true);
                onClose();
              }}
            />
          )}
          <div onClick={closeButton}>
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
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>ФИО</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Пример: Иванов Иван Иванович"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.name || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Номер телефона</div>
                {isEditing ? (
                  <InputMask
                    type="text"
                    mask="+7 (___) ___-__-__"
                    replacement={{ _: /\d/ }}
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="+7 (___) ___-__-__"
                    autoComplete="new-password"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.number || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Должность</div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      label={"Выберите должность"}
                      options={positions?.map((position) => position.name)}
                      value={formData.position}
                      onChange={(event, newValue) => {
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          position: newValue,
                        }));
                        setIsEdited(true);
                      }}
                    />
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.position || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Пол</div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      label={"Выберите пол"}
                      options={["Мужской", "Женский"]}
                      value={formData.gender}
                      onChange={(event, newValue) => {
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          gender: newValue,
                        }));
                        setIsEdited(true);
                      }}
                    />
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.gender || "—"}
                  </div>
                )}
              </div>
            </div>
          </div>
          {(user?.role !== roles.superAdmin && accessMenu?.personalUpdate) && isEditing && (
            <div className={classes.requestButton}>
              <Button
                onClick={handleCancelEdit}
                backgroundcolor="var(--hover-gray)"
                color="#000"
              >
                Отмена
              </Button>
              <Button
                type="submit"
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

export default UpdateRequestAirlineStaff;
