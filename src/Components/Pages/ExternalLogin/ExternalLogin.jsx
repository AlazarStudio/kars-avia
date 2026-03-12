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
import { EXTERNAL_USER_SIGN_IN_WITH_MAGIC_LINK, PASSENGER_REQUEST_EXTERNAL_USER_SIGN_IN_WITH_MAGIC_LINK } from "../../../../graphQL_requests";
import { getExternalAuthErrorMessage } from "../../../constants/externalAuthErrors";

const KIND_EXTERNAL_USER = "EXTERNAL_USER";
const KIND_PASSENGER_REQUEST_EXTERNAL_USER = "PASSENGER_REQUEST_EXTERNAL_USER";

function ExternalLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | success | error

  const [externalUserSignIn] = useMutation(EXTERNAL_USER_SIGN_IN_WITH_MAGIC_LINK);
  const [passengerRequestExternalUserSignIn] = useMutation(
    PASSENGER_REQUEST_EXTERNAL_USER_SIGN_IN_WITH_MAGIC_LINK
  );

  useEffect(() => {
    const token = searchParams.get("token");
    const kind = searchParams.get("kind");

    if (!token?.trim()) {
      setError("Ссылка недействительна: отсутствует токен.");
      setStatus("error");
      return;
    }

    if (kind !== KIND_EXTERNAL_USER && kind !== KIND_PASSENGER_REQUEST_EXTERNAL_USER) {
      setError("Ссылка недействительна: неизвестный тип входа.");
      setStatus("error");
      return;
    }

    const run = async () => {
      try {
        const variables = { token: token.trim() };
        let data;

        if (kind === KIND_EXTERNAL_USER) {
          const res = await externalUserSignIn({ variables });
          data = res?.data?.externalUserSignInWithMagicLink;
        } else {
          const res = await passengerRequestExternalUserSignIn({ variables });
          data = res?.data?.passengerRequestExternalUserSignInWithMagicLink;
        }

        if (!data?.token) {
          setError("Ссылка недействительна или истекла.");
          setStatus("error");
          return;
        }

        document.cookie = `token=${data.token}; SameSite=Lax; Max-Age=86400; Path=/`;
        if (data.refreshToken) {
          document.cookie = `refreshToken=${data.refreshToken}; SameSite=Lax; Max-Age=${30 * 24 * 3600}; Path=/`;
        }

        setStatus("success");
        if (kind === KIND_PASSENGER_REQUEST_EXTERNAL_USER && data?.passengerRequestExternalUser?.passengerRequestId) {
          const prId = data.passengerRequestExternalUser.passengerRequestId;
          window.location.href = `/reserve/representativeRequestsPlacement/${prId}`;
        } else {
          window.location.href = "/";
        }
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
