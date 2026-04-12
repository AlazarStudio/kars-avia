import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import {
  getCookie,
  LOGOUT,
  MARK_USER_OFFLINE,
  MARK_USER_ONLINE,
} from "../graphQL_requests";
import { authService } from "./services/authService";
import { useDialog } from "./contexts/DialogContext";
import { useToast } from "./contexts/ToastContext";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

function lastMinutesPhrase(minutes) {
  const n = Math.max(1, Math.round(minutes));
  if (n === 1) return "За последнюю минуту";
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word;
  if (mod100 >= 11 && mod100 <= 14) word = "минут";
  else if (mod10 === 1) word = "минуту";
  else if (mod10 >= 2 && mod10 <= 4) word = "минуты";
  else word = "минут";
  return `За последние ${n} ${word}`;
}

export function UserActivityTracker() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { confirm } = useDialog();
  const { error: notifyError } = useToast();
  const token = getCookie("token");
  const [markUserOffline] = useMutation(MARK_USER_OFFLINE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [markUserOnline] = useMutation(MARK_USER_ONLINE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [logoutMutation] = useMutation(LOGOUT);

  const [showModal, setShowModal] = useState(false);
  const idleTimerRef = useRef(null);
  const isOfflineRef = useRef(false);

  const idleMinutes = IDLE_TIMEOUT_MS / 60000;
  const bodyText = `${lastMinutesPhrase(idleMinutes)} не было активности в системе, статус отображается как «офлайн».`;

  const resetIdleTimer = () => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      isOfflineRef.current = true;
      setShowModal(true);
      markUserOffline().catch(() => {});
    }, IDLE_TIMEOUT_MS);
  };

  const handleActivity = () => {
    if (isOfflineRef.current) {
      isOfflineRef.current = false;
      markUserOnline().catch(() => {});
    }
    resetIdleTimer();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetIdleTimer();
  };

  const handleLogout = async () => {
    const isConfirmed = await confirm("Вы уверены что хотите выйти?");
    if (!isConfirmed) return;

    try {
      const accessToken = authService.getAccessToken();
      const { data } = await logoutMutation({
        context: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      if (data) {
        setShowModal(false);
        authService.clear();
        localStorage.removeItem("isAirline");
        navigate("/");
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      notifyError("Не удалось выйти из аккаунта.");
    }
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "pointerdown", "scroll"];
    events.forEach((e) => window.addEventListener(e, handleActivity));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimerRef.current);
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, []);

  return (
    <Dialog
      open={showModal}
      onClose={handleCloseModal}
      PaperProps={{
        sx: {
          borderRadius: "10px",
          maxWidth: 600,
          width: "100%",
          mx: 2,
          boxShadow: theme.shadows[8],
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogContent sx={{ pt: 3, px: 3, pb: 1 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          >
            <ScheduleRoundedIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h6" component="h2" fontWeight={600}>
            Вы ещё на связи?
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.6, maxWidth: 520 }}
          >
            {bodyText}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          pt: 1,
          display: "block",
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleLogout}
            startIcon={<LogoutRoundedIcon />}
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              py: 1,
              borderRadius: 2,
              color: "common.white",
              "& .MuiButton-startIcon": { color: "common.white" },
            }}
          >
            Выйти
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCloseModal}
            startIcon={<CheckCircleRoundedIcon />}
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              py: 1,
              borderRadius: 2,
              whiteSpace: "nowrap",
            }}
          >
            Продолжить работу
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
