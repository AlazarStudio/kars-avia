import React, { useState } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  Container,
  Alert,
} from "@mui/material";

import { REQUEST_RESET_PASSWORD } from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

function Email() {
  const [resetRequestPassword] = useMutation(REQUEST_RESET_PASSWORD);

  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response = await resetRequestPassword({
        variables: {
          email: String(email),
        },
      });

      // let token = response_signIn && response_signIn.data.signIn.token;
      alert("Инструкции отправлены на указанный email.");
      // console.log(response);

      navigate("/login");
    } catch (err) {
      setError("Ошибка при восстановлении. Проверьте введённый email.");
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
          <Alert severity="error" sx={{ mt: 2, width: "396px" }}>
            {error}
          </Alert>
        )}
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            mt: 1,
            width: "450px",
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
            id="email"
            label="Введите ваш Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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

export default Email;
