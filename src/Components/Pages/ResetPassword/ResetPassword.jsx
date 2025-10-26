import React, { useState } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  Container,
  Alert,
} from "@mui/material";

import { RESET_PASSWORD } from "../../../../graphQL_requests.js";
import { useMutation } from "@apollo/client";
import { useNavigate, useSearchParams } from "react-router-dom";

function ResetPassword() {
  const [resetRequestPassword] = useMutation(RESET_PASSWORD);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Извлекаем query-параметры
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // получаем значение токена
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // console.log(token);

  // console.log("newPassword: ", newPassword);
  // console.log("confirmNewPassword: ", confirmNewPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Пароль должен содержать минимум 8 символов.");
      return;
    }

    try {
      let response = await resetRequestPassword({
        variables: {
          newPassword: newPassword,
          token: token,
        },
      });

      // let token = response_signIn && response_signIn.data.signIn.token;
      alert("Пароль обновлён успешно.");
      // console.log(response);

      navigate("/login");
    } catch (err) {
      setError("Ошибка при обновлении пароля.");
      console.error(err);
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        height: "100vh",
        minWidth: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--menu-bg)",
      }}
    >
      <img
        src="/kars-avia-mainLogo.png"
        alt=""
        style={{ userSelect: "none" }}
      />
      <Box
        sx={{
          padding: "50px 20px",
          marginTop: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#fff",
          borderRadius: "20px",
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          sx={{ fontWeight: "bold", color: "var(--main-gray)" }}
        >
          Восстановление пароля
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            mt: 1,
            width: "396px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", width: "396px" }}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="newPassword"
              label="Введите новый пароль"
              type={showPassword2 ? "text" : "password"}
              name="newPassword"
              autoComplete="newPassword"
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <img
              src={showPassword2 ? "/eyeOpen.png" : "/eyeClose.png"}
              style={{
                width: "20px",
                height: "20px",
                objectFit: "contain",
                position: "absolute",
                right: "10px",
                top: "35px",
                cursor: "pointer",
              }}
              onClick={() => setShowPassword2((prev) => !prev)}
              alt=""
            />
          </div>

          <div style={{ position: "relative", width: "396px" }}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Введите новый пароль повторно"
              type={showPassword ? "text" : "password"}
              name="email"
              autoComplete="email"
              autoFocus
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
            <img
              src={showPassword ? "/eyeOpen.png" : "/eyeClose.png"}
              style={{
                width: "20px",
                height: "20px",
                objectFit: "contain",
                position: "absolute",
                right: "10px",
                top: "35px",
                cursor: "pointer",
              }}
              onClick={() => setShowPassword((prev) => !prev)}
              alt=""
            />
          </div>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{
              mt: 1,
              height: "50px",
              fontWeight: "bold",
              backgroundColor: "var(--dark-blue)",
            }}
          >
            Далее
          </Button>
        </Box>

        {/* <Box component="form" onSubmit={handleSubmitSignUp} noValidate sx={{ mt: 1 }}>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 2, height: '50px', fontWeight: 'bold' }}
                    >
                        Зарегистрировать Админа
                    </Button>
                </Box> */}
      </Box>
    </Container>
  );
}

export default ResetPassword;
