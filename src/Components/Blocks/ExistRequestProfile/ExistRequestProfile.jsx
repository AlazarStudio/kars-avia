import React, { useState, useRef, useEffect } from "react";
import classes from "./ExistRequestProfile.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { getCookie, server, UPDATE_USER } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function ExistRequestProfile({
  show,
  onClose,
  user,
  updateUser,
  openDeleteComponent,
}) {
  const token = getCookie("token");

  const [uploadFile, { data, loading, error }] = useMutation(UPDATE_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const [formData, setFormData] = useState({
    id: "",
    images: null,
    name: "",
    email: "",
    login: "",
    password: "",
  });

  const [index, setIndex] = useState(null);
  const [showIMG, setShowIMG] = useState();

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id || "",
        images: null,
        name: user.name || "",
        email: user.email || "",
        login: user.login || "",
        password: user.password || "",
      });
      setShowIMG(user.images[0]);
      setIndex(user.index);
    }
  }, [user]);

  const sidebarRef = useRef();

  const closeButton = () => {
    let success = confirm("Вы уверены, все несохраненные данные будут удалены");
    if (success) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        images: file,
      }));
    }
  };

  const handleUpdate = async () => {
    let response_update_user = await uploadFile({
      variables: {
        input: {
          id: formData.id,
          name: formData.name,
          email: formData.email,
          login: formData.login,
          password: formData.password,
        },
        images: formData.images,
      },
    });


    if (response_update_user) {
      updateUser(response_update_user.data.updateUser);
      onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="Close" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <div className={classes.requestDataInfo_img}>
            <div className={classes.requestDataInfo_img_imgBlock}>
              <img src={`${server}${showIMG}`} alt="" />
            </div>
          </div>

          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>ФИО</div>
            <input
              type="text"
              name="name"
              placeholder="Иванов Иван Иванович"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Почта</div>
            <input
              type="text"
              name="email"
              placeholder="example@mail.ru"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Логин</div>
            <input
              type="text"
              name="login"
              placeholder="Логин"
              value={formData.login}
              onChange={handleChange}
            />
          </div>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Пароль</div>
            <input
              type="text"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Аватар</div>
            <input type="file" name="images" onChange={handleFileChange} />
          </div>
        </div>
      </div>

      <div className={classes.requestButton}>
        {/* <Button
          onClick={() => openDeleteComponent(index, formData.id)}
          backgroundcolor={"#FF9C9C"}
        >
          Удалить{" "}
          <img
            style={{ width: "fit-content", height: "fit-content" }}
            src="/delete.png"
            alt=""
          />
        </Button> */}
        <Button
          onClick={handleUpdate}
          backgroundcolor={"#3CBC6726"}
          color={"#3B6C54"}
        >
          Изменить{" "}
          <img
            style={{ width: "fit-content", height: "fit-content" }}
            src="/editDispetcher.png"
            alt=""
          />
        </Button>
      </div>
    </Sidebar>
  );
}

export default ExistRequestProfile;