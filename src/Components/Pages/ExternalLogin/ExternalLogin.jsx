import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import {
  Box,
  Typography,
  Container,
  Alert,
} from "@mui/material";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import { AUTHORIZE_EXTERNAL_AUTH } from "../../../../graphQL_requests";
import { getExternalAuthErrorMessage } from "../../../constants/externalAuthErrors";

function ExternalLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | success | error
  console.log(searchParams.get("token")?.trim());

  const [authorizeExternalAuth] = useMutation(AUTHORIZE_EXTERNAL_AUTH);

  useEffect(() => {
    const token = searchParams.get("token")?.trim();

    if (!token) {
      setError("Ссылка недействительна: отсутствует токен.");
      setStatus("error");
      return;
    }

    const run = async () => {
      try {
        const res = await authorizeExternalAuth({
          variables: { token },
        });
        const data = res?.data?.authorizeExternalAuth;
        console.log(data);

        if (!data?.token) {
          setError("Ссылка недействительна или истекла.");
          setStatus("error");
          return;
        }

        document.cookie = `token=${data.token}; SameSite=Lax; Max-Age=86400; Path=/`;
        if (data.refreshToken) {
          document.cookie = `refreshToken=${data.refreshToken}; SameSite=Lax; Max-Age=${30 * 24 * 3600}; Path=/`;
        }

        const extUser = data.externalUser;
        if (extUser) {
          const payload = JSON.stringify({
            scope: extUser.scope,
            hotelId: extUser.hotelId ?? null,
            driverId: extUser.driverId ?? null,
          });
          document.cookie = `externalUserContext=${encodeURIComponent(payload)}; SameSite=Lax; Max-Age=86400; Path=/`;
        }

        setStatus("success");
        window.location.href = "/";
      } catch (err) {
        setError(getExternalAuthErrorMessage(err, "Ошибка входа по ссылке."));
        setStatus("error");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (status === "loading") {
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
        <MUILoader fullHeight="100vh" />
      </Container>
    );
  }

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
        src="/KARSAVIA_withoutLogo.png"
        alt=""
        style={{ userSelect: "none", height: "90px", position: "absolute", top: 40 }}
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
          Вход по ссылке
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {status === "error" && (
          <Typography
            sx={{ mt: 2, color: "var(--main-gray)", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/login")}
          >
            Перейти на страницу входа
          </Typography>
        )}
      </Box>
    </Container>
  );
}

export default ExternalLogin;
