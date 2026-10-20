import { Box, Button, Typography } from "@mui/material";
import ExportIcon from "../../../shared/icons/ExportIcon.jsx";

const NEW_SYSTEM_URL = "https://app.karsavia.ru";

// Показывается вместо формы входа, когда учётка неактивна: работа ушла в новую систему.
function SystemMovedNotice({ onBack }) {
  return (
    <Box
      sx={{
        width: "450px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          backgroundColor: "var(--gray)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ExportIcon width={26} height={26} />
      </Box>
      <Typography
        component="h1"
        variant="h5"
        sx={{ mt: 2, fontWeight: "bold", color: "var(--main-gray)" }}
      >
        Система переехала
      </Typography>
      <Typography sx={{ mt: 1, fontSize: "15px", color: "var(--main-gray)" }}>
        Эта версия Kars Avia больше не используется.
        <br />
        Работа продолжается в новой системе: <strong>app.karsavia.ru</strong>
      </Typography>
      <Button
        component="a"
        href={NEW_SYSTEM_URL}
        fullWidth
        variant="contained"
        sx={{
          mt: 3,
          height: "50px",
          fontWeight: "bold",
          backgroundColor: "var(--dark-blue)",
        }}
      >
        Перейти в новую систему
      </Button>
      <p
        style={{
          marginTop: "16px",
          fontSize: "14px",
          fontWeight: "600",
          color: "var(--blue)",
          cursor: "pointer",
        }}
        onClick={onBack}
      >
        Вернуться ко входу
      </p>
    </Box>
  );
}

export default SystemMovedNotice;
