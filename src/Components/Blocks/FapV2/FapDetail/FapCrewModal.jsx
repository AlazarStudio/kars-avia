import React, { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  GET_AIRLINES_RELAY,
  UPDATE_PASSENGER_REQUEST_CREW,
} from "../../../../../graphQL_requests";
import Button from "../../../Standart/Button/Button";
import MultiSelectAutocomplete from "../../MultiSelectAutocomplete/MultiSelectAutocomplete";
import { useToast } from "../../../../contexts/ToastContext";

export default function FapCrewModal({ open, onClose, request, token, onSaved }) {
  const { success, error: notifyError } = useToast();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery(GET_AIRLINES_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    skip: !open,
  });

  const crewOptions = useMemo(() => {
    const airlines = data?.airlines?.airlines || [];
    const airline = airlines.find((a) => a.id === request?.airlineId);
    return (airline?.staff || []).map((s) => ({
      id: s.id,
      name: s.name || "",
      positionName: s.position?.name || "",
      gender: s.gender || "",
      number: s.number || "",
      label: [s.name, s.position?.name, s.gender].filter(Boolean).join(", "),
    }));
  }, [data, request?.airlineId]);

  useEffect(() => {
    if (!open) return;
    const existing = request?.crewMembers || [];
    // сопоставляем ростер с актуальными опциями staff по airlinePersonalId
    const mapped = existing.map((m) => {
      const opt = crewOptions.find((o) => o.id === m.airlinePersonalId);
      return (
        opt || {
          id: m.airlinePersonalId || m.fullName,
          name: m.fullName || "",
          positionName: m.position || "",
          gender: m.gender || "",
          number: m.phone || "",
          label: [m.fullName, m.position, m.gender].filter(Boolean).join(" · "),
        }
      );
    });
    setSelected(mapped);
  }, [open, request?.crewMembers, crewOptions]);

  const [updateCrew] = useMutation(UPDATE_PASSENGER_REQUEST_CREW, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const crewMembers = selected.map((c) => ({
        airlinePersonalId: c.id,
        fullName: c.name,
        position: c.positionName || null,
        gender: c.gender || null,
        phone: c.number || null,
      }));
      await updateCrew({ variables: { requestId: request.id, crewMembers } });
      success("Ростер экипажа обновлён");
      onSaved?.();
      onClose();
    } catch {
      notifyError("Ошибка при обновлении экипажа");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: "16px", minWidth: 480, maxWidth: 560 } }}
    >
      <DialogTitle
        sx={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "var(--text)",
          borderBottom: "1px solid #F1F5F9",
          pb: 2,
        }}
      >
        Экипаж заявки
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important", pb: 1 }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#545873", marginTop: 0 }}>
          Выберите сотрудников, которые входят в экипаж этой заявки.
        </p>
        <MultiSelectAutocomplete
          dropdownWidth="100%"
          label="Сотрудники экипажа"
          isMultiple
          showSelectAll
          options={crewOptions}
          value={selected}
          onChange={(event, newValue) => setSelected(newValue || [])}
        />
      </DialogContent>
      <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
        <Button backgroundcolor="#F6F7FB" color="#545873" onClick={onClose}>
          Отмена
        </Button>
        <Button
          backgroundcolor="var(--dark-blue)"
          color="#fff"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
