import React, { useState } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  Container,
  Alert,
} from "@mui/material";

import { SINGIN, SINGUP } from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

function Login() {
  const [signIn] = useMutation(SINGIN);
  const [signUp] = useMutation(SINGUP);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmitSignUp = async (e) => {
    e.preventDefault();

    try {
      let response_signIn = await signUp({
        variables: {
          input: {
            login: "admin",
            password: "admin",
            name: "admin",
            email: "admin",
          },
        },
      });

      alert("Success");
      navigate("/");
      window.location.reload();
    } catch (err) {
      setError("Ошибка авторизации. Проверьте логин или пароль.");
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response_signIn = await signIn({
        variables: {
          input: {
            login: username,
            password: password,
          },
        },
      });

      let token = response_signIn && response_signIn.data.signIn.token;

      // document.cookie = `token=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`; // когда будет https и заливать куки из сервака
      document.cookie = `token=${token}; SameSite=Lax; Max-Age=86400`;

      navigate("/");
      window.location.reload();
    } catch (err) {
      setError("Ошибка авторизации. Проверьте логин или пароль.");
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
          Вход в CRM Kars Avia
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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            label="Имя пользователя"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div style={{ position: "relative", width: "450px" }}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <p
            style={{
              marginTop: "10px",
              width: "100%",
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--blue)",
              cursor: "pointer",
            }}
            onClick={() => {
              navigate("/reset-to-email");
            }}
          >
            Восстановить пароль
          </p>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{
              mt: 3,
              height: "50px",
              fontWeight: "bold",
              backgroundColor: "var(--dark-blue)",
            }}
          >
            Войти
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

export default Login;
