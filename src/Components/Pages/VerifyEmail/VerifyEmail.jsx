import React, { useEffect, useState } from "react";
import { Button, Box, Typography, Container, CircularProgress, Alert } from "@mui/material";
import { useMutation } from "@apollo/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { VERIFY_EMAIL } from "../../../../graphQL_requests.js";

function VerifyEmail() {
  const [verifyEmail] = useMutation(VERIFY_EMAIL);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Ссылка недействительна или повреждена.");
      return;
    }

    verifyEmail({ variables: { token } })
      .then((res) => {
        setStatus("success");
        setMessage(res?.data?.verifyEmail || "Почта успешно подтверждена. Теперь вы можете войти в аккаунт.");
      })
      .catch((err) => {
        setStatus("error");
        const msg = err?.graphQLErrors?.[0]?.message;
        setMessage(msg || "Ссылка недействительна, устарела или уже была использована.");
      });
  }, []);

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        height: "100vh",
        minWidth: "100vw",
        display: "flex",
        gap: "20px",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--menu-bg)",
      }}
    >
      <img src="/kars_avia_logo_02.png" alt="" style={{ userSelect: "none", height: "90px" }} />
      <Box
        sx={{
          padding: "50px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          backgroundColor: "#fff",
          borderRadius: "20px",
          minWidth: "400px",
        }}
      >
        <Typography component="h1" variant="h5" sx={{ fontWeight: "bold", color: "var(--main-gray)" }}>
          Подтверждение почты
        </Typography>

        {status === "loading" && <CircularProgress sx={{ color: "var(--dark-blue)" }} />}

        {status === "success" && (
          <>
            <Alert severity="success" sx={{ width: "100%" }}>
              {message}
            </Alert>
            <Button
              fullWidth
              variant="contained"
              sx={{ height: "50px", fontWeight: "bold", backgroundColor: "var(--dark-blue)" }}
              onClick={() => navigate("/login")}
            >
              Войти
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <Alert severity="error" sx={{ width: "100%" }}>
              {message}
            </Alert>
            <Button
              fullWidth
              variant="outlined"
              sx={{ height: "50px", fontWeight: "bold" }}
              onClick={() => navigate("/login")}
            >
              На страницу входа
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
}

export default VerifyEmail;
