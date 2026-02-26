import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { getCookie, MARK_USER_OFFLINE, MARK_USER_ONLINE } from "../graphQL_requests";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export function UserActivityTracker() {
  const token = getCookie("token");
  const [markUserOffline] = useMutation(MARK_USER_OFFLINE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [markUserOnline] = useMutation(MARK_USER_ONLINE, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [showModal, setShowModal] = useState(false);
  const idleTimerRef = useRef(null);
  const isOfflineRef = useRef(false);

  const resetIdleTimer = () => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      isOfflineRef.current = true;
      setShowModal(true);
      markUserOffline().catch(() => {});
      // console.log('markUserOffline');
      
    }, IDLE_TIMEOUT_MS);
  };

  const handleActivity = () => {
    if (isOfflineRef.current) {
      isOfflineRef.current = false;
      markUserOnline().catch(() => {});
      // console.log('markUserOnline');
    }
    resetIdleTimer();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetIdleTimer();
    // console.log('handleCloseModal');
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
    <Dialog open={showModal} onClose={handleCloseModal}>
      <DialogTitle>Вы тут?</DialogTitle>
      <DialogContent>
        <Typography>
          Вы были неактивны 5 минут. Ваш статус изменён на «офлайн».
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleCloseModal}>
          Я тут
        </Button>
      </DialogActions>
    </Dialog>
  );
}
