import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Drawer from "@mui/material/Drawer";
import classes from "../FapDetail/FapDetail.module.css";
import lClasses from "./FapLivingSection.module.css";
import {
  COMPLETE_PASSENGER_REQUEST_LIVING_EARLY,
  CREATE_EXTERNAL_AUTH_LINK,
  getCookie,
} from "../../../../../graphQL_requests";
import { SERVICE_STATUS_CONFIG, formatDate } from "../fapConstants";
import Button from "../../../Standart/Button/Button";
import AddRepresentativeHotel from "../../AddRepresentativeHotel/AddRepresentativeHotel";
import RepresentativeHotelDetail from "../../RepresentativeHotelDetail/RepresentativeHotelDetail";
import { useToast } from "../../../../contexts/ToastContext";
import { useDialog } from "../../../../contexts/DialogContext";

export default function FapLivingSection({ service, color, request, onRefetch }) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  const [open, setOpen] = useState(false);
  const [showAddHotel, setShowAddHotel] = useState(false);
  const [expandedHotels, setExpandedHotels] = useState({});

  // Early complete
  const [showEarlyForm, setShowEarlyForm] = useState(false);
  const [earlyReason, setEarlyReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Hotel management dialog (guests: add/edit/delete/relocate/evict)
  const [hotelMgmtIndex, setHotelMgmtIndex] = useState(null);

  // External auth link dialog
  const [issueLinkState, setIssueLinkState] = useState(null); // { hotelIndex, hotelId }
  const [issueLinkForm, setIssueLinkForm] = useState({ email: "", name: "", accessType: "CRM" });
  const [issueLinkResult, setIssueLinkResult] = useState(null);
  const [issueLinkCooldown, setIssueLinkCooldown] = useState(0);

  const statusCfg = SERVICE_STATUS_CONFIG[service?.status] || {};

  const [completeLivingEarly] = useMutation(COMPLETE_PASSENGER_REQUEST_LIVING_EARLY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [createExternalLink, { loading: issuingLink }] = useMutation(CREATE_EXTERNAL_AUTH_LINK, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const addNotification = useCallback((msg, type) => {
    if (type === "error") notifyError(msg);
    else success(msg);
  }, [success, notifyError]);

  if (!service?.plan?.enabled) return null;

  const hotels = service.hotels || [];
  const isCompleted = service.status === "COMPLETED" || service.status === "CANCELLED";

  const toggleHotel = (idx) =>
    setExpandedHotels((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const totalCapacity = hotels.reduce((s, h) => s + (h.peopleCount || 0), 0);
  const totalGuests = hotels.reduce((s, h) => s + (h.people?.length || 0), 0);

  const handleCompleteEarly = async () => {
    if (!earlyReason.trim()) return;
    const ok = await confirm("Завершить услугу досрочно?");
    if (!ok) return;
    try {
      setSaving(true);
      await completeLivingEarly({ variables: { requestId: request.id, reason: earlyReason } });
      setEarlyReason("");
      setShowEarlyForm(false);
      onRefetch();
      success("Услуга завершена досрочно");
    } catch {
      notifyError("Ошибка при завершении");
    } finally {
      setSaving(false);
    }
  };

  const openIssueLinkDialog = (hotelIndex, hotelId) => {
    setIssueLinkState({ hotelIndex, hotelId });
    setIssueLinkForm({ email: "", name: "", accessType: "CRM" });
    setIssueLinkResult(null);
  };

  const handleIssueLink = async () => {
    if (!issueLinkState || issueLinkCooldown > Date.now()) {
      notifyError("Подождите перед повторной выдачей ссылки");
      return;
    }
    if (!issueLinkForm.email.trim()) {
      notifyError("Укажите email");
      return;
    }
    try {
      setSaving(true);
      const { data } = await createExternalLink({
        variables: {
          input: {
            email: issueLinkForm.email.trim(),
            name: issueLinkForm.name.trim() || undefined,
            scope: "HOTEL",
            accessType: issueLinkForm.accessType,
            hotelId: issueLinkState.hotelId,
            passengerRequestId: request.id,
          },
        },
      });
      setIssueLinkResult(data?.createExternalAuthLink);
      setIssueLinkCooldown(Date.now() + 60000);
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Ошибка при выдаче ссылки");
    } finally {
      setSaving(false);
    }
  };

  const mgmtHotel = hotelMgmtIndex != null ? hotels[hotelMgmtIndex] : null;

  return (
    <div className={classes.section}>
      <div className={classes.sectionHeader} onClick={() => setOpen((v) => !v)}>
        <div className={classes.sectionHeaderLeft}>
          <div className={classes.sectionDot} style={{ background: color }} />
          <span className={classes.sectionName}>Проживание</span>
          <span className={classes.svcStatusBadge} style={{ color: statusCfg.color, background: statusCfg.bg }}>
            {statusCfg.label || service.status}
          </span>
        </div>
        <div className={classes.sectionHeaderRight}>
          <span className={lClasses.guestSummary}>
            {totalGuests}/{totalCapacity} гостей
          </span>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            {hotels.length}{" "}
            {hotels.length === 1 ? "отель" : hotels.length < 5 ? "отеля" : "отелей"}
          </span>
          <span className={`${classes.chevron} ${open ? classes.chevronOpen : ""}`}>▾</span>
        </div>
      </div>

      {open && (
        <div className={classes.sectionBody}>
          {/* Plan row */}
          <div className={classes.planRow}>
            {service.plan?.peopleCount && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Мест по плану</span>
                <span className={classes.planValue}>{service.plan.peopleCount}</span>
              </div>
            )}
            {service.plan?.plannedFromAt && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Заселение</span>
                <span className={classes.planValue}>{formatDate(service.plan.plannedFromAt)}</span>
              </div>
            )}
            {service.plan?.plannedToAt && (
              <div className={classes.planItem}>
                <span className={classes.planLabel}>Выселение</span>
                <span className={classes.planValue}>{formatDate(service.plan.plannedToAt)}</span>
              </div>
            )}
          </div>

          {hotels.map((hotel, idx) => {
            const people = hotel.people || [];
            const capacity = hotel.peopleCount || 0;
            const fillPct = capacity > 0 ? Math.min(100, Math.round((people.length / capacity) * 100)) : 0;
            const isFull = capacity > 0 && people.length >= capacity;
            const isExpanded = expandedHotels[idx];

            return (
              <div key={hotel.itemId || idx} className={lClasses.hotelCard}>
                {/* Hotel header */}
                <div className={lClasses.hotelHeader} onClick={() => toggleHotel(idx)}>
                  <div className={lClasses.hotelHeaderLeft}>
                    <div
                      className={lClasses.hotelColorBar}
                      style={{ background: isFull ? "#10B981" : color }}
                    />
                    <div className={lClasses.hotelInfo}>
                      <div className={lClasses.hotelName}>{hotel.name || "Отель"}</div>
                      {hotel.address && (
                        <div className={lClasses.hotelAddress}>{hotel.address}</div>
                      )}
                    </div>
                  </div>

                  <div className={lClasses.hotelHeaderRight}>
                    {(hotel.checkInAt || hotel.checkOutAt) && (
                      <div className={lClasses.hotelDates}>
                        <span>{formatDate(hotel.checkInAt)}</span>
                        {hotel.checkOutAt && (
                          <>
                            <span className={lClasses.dateSep}>→</span>
                            <span>{formatDate(hotel.checkOutAt)}</span>
                          </>
                        )}
                      </div>
                    )}
                    <div
                      className={lClasses.occupancyChip}
                      style={{
                        background: isFull ? "#ECFDF5" : "#F1F5F9",
                        color: isFull ? "#10B981" : "#64748B",
                      }}
                    >
                      {people.length}{capacity > 0 ? `/${capacity}` : ""}
                    </div>
                    <button
                      className={lClasses.reportBtn}
                      onClick={(e) => { e.stopPropagation(); navigate(`/fapv2/${requestId}/report/${idx}`); }}
                      title="Отчёт по отелю"
                    >
                      Отчёт
                    </button>
                    <button
                      className={lClasses.mgmtBtn}
                      onClick={(e) => { e.stopPropagation(); setHotelMgmtIndex(idx); }}
                      title="Управление гостями"
                    >
                      Гости
                    </button>
                    {hotel.hotelId && (
                      <button
                        className={lClasses.linkBtn}
                        onClick={(e) => { e.stopPropagation(); openIssueLinkDialog(idx, hotel.hotelId); }}
                        title="Выдать ссылку доступа для гостиницы"
                      >
                        Ссылка
                      </button>
                    )}
                    <span className={`${classes.chevron} ${isExpanded ? classes.chevronOpen : ""}`}>▾</span>
                  </div>
                </div>

                {/* Progress bar */}
                {capacity > 0 && (
                  <div className={lClasses.progressBar}>
                    <div
                      className={lClasses.progressFill}
                      style={{ width: `${fillPct}%`, background: isFull ? "#10B981" : color }}
                    />
                  </div>
                )}

                {/* Compact guest list */}
                {isExpanded && (
                  <div className={lClasses.hotelBody}>
                    {people.length === 0 ? (
                      <div className={lClasses.emptyGuests}>
                        <span className={lClasses.emptyGuestsIcon}>🛏</span>
                        <span>Гости ещё не добавлены</span>
                        {!isCompleted && (
                          <Button
                            backgroundcolor="var(--dark-blue)"
                            color="#fff"
                            onClick={(e) => { e.stopPropagation(); setHotelMgmtIndex(idx); }}
                          >
                            + Добавить гостя
                          </Button>
                        )}
                      </div>
                    ) : (
                      <table className={classes.table}>
                        <thead>
                          <tr>
                            <th>ФИО</th>
                            <th>Телефон</th>
                            <th>Номер</th>
                            <th>Категория</th>
                          </tr>
                        </thead>
                        <tbody>
                          {people.map((p, pi) => (
                            <tr key={pi}>
                              <td>{p.fullName || "—"}</td>
                              <td>{p.phone || "—"}</td>
                              <td>
                                {p.roomNumber ? (
                                  <span className={lClasses.roomBadge}>{p.roomNumber}</span>
                                ) : "—"}
                              </td>
                              <td>
                                {p.roomCategory ? (
                                  <span className={lClasses.categoryBadge}>{p.roomCategory}</span>
                                ) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {people.length > 0 && !isCompleted && (
                      <div style={{ paddingTop: 10 }}>
                        <Button
                          backgroundcolor="#F6F7FB"
                          color="#545873"
                          onClick={(e) => { e.stopPropagation(); setHotelMgmtIndex(idx); }}
                        >
                          Управление гостями →
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!isCompleted && (
            <div className={classes.sectionActions}>
              <Button
                backgroundcolor="var(--dark-blue)"
                color="#fff"
                onClick={() => setShowAddHotel(true)}
              >
                + Добавить отель
              </Button>
              <Button
                backgroundcolor="#FEF2F2"
                color="#EF4444"
                onClick={() => setShowEarlyForm((v) => !v)}
              >
                Завершить досрочно
              </Button>
            </div>
          )}

          {showEarlyForm && (
            <div className={classes.addForm}>
              <div className={classes.addFormField}>
                <label className={classes.addFormLabel}>Причина *</label>
                <input
                  className={classes.addFormInput}
                  value={earlyReason}
                  onChange={(e) => setEarlyReason(e.target.value)}
                  placeholder="Укажите причину..."
                />
              </div>
              <div className={classes.addFormActions}>
                <Button backgroundcolor="var(--hover-gray)" color="#000" onClick={() => { setShowEarlyForm(false); setEarlyReason(""); }}>
                  Отмена
                </Button>
                <Button backgroundcolor="#EF4444" color="#fff" onClick={handleCompleteEarly} disabled={saving || !earlyReason.trim()}>
                  Завершить
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {showAddHotel && (
        <AddRepresentativeHotel
          show={showAddHotel}
          onClose={() => { setShowAddHotel(false); onRefetch(); }}
          request={request}
        />
      )}

      {/* Hotel guests management drawer */}
      <Drawer
        anchor="right"
        open={hotelMgmtIndex != null}
        onClose={() => setHotelMgmtIndex(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 700 },
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #E4E4EF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#2B2B34",
            }}
          >
            {mgmtHotel?.name || "Отель"} — гости
          </span>
          <button
            onClick={() => setHotelMgmtIndex(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94A3B8",
              fontSize: 18,
              padding: "4px 8px",
              borderRadius: 8,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {mgmtHotel && (
            <RepresentativeHotelDetail
              request={request}
              hotel={mgmtHotel}
              hotelIndex={hotelMgmtIndex}
              onRefetch={onRefetch}
              addNotification={addNotification}
              hidePageTitle
              onGenerateReport={() => {
                setHotelMgmtIndex(null);
                navigate(`/fapv2/${requestId}/report/${hotelMgmtIndex}`);
              }}
            />
          )}
        </div>
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #E4E4EF",
            flexShrink: 0,
          }}
        >
          <Button
            backgroundcolor="#F6F7FB"
            color="#545873"
            onClick={() => setHotelMgmtIndex(null)}
          >
            Закрыть
          </Button>
        </div>
      </Drawer>

      {/* External auth link dialog */}
      {issueLinkState && (
        <Dialog
          open
          onClose={() => { setIssueLinkState(null); setIssueLinkResult(null); }}
          PaperProps={{ sx: { borderRadius: "15px", minWidth: 400 } }}
        >
          <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}>
            Ссылка для гостиницы
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
            {issueLinkResult ? (
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#10B981", marginBottom: 8 }}>
                  {issueLinkResult.emailed ? "Ссылка отправлена на email." : "Ссылка создана."}
                </p>
                {issueLinkResult.link && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      readOnly
                      value={issueLinkResult.link}
                      className={classes.addFormInput}
                      style={{ flex: 1, fontSize: 12 }}
                      onClick={(e) => e.target.select()}
                    />
                    <Button
                      backgroundcolor="var(--dark-blue)"
                      color="#fff"
                      onClick={() => { navigator.clipboard.writeText(issueLinkResult.link); success("Скопировано"); }}
                    >
                      Копировать
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIssueLinkForm((f) => ({ ...f, accessType: "CRM" }))}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: `2px solid ${issueLinkForm.accessType === "CRM" ? "var(--dark-blue)" : "#E4E4EF"}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      background: issueLinkForm.accessType === "CRM" ? "#EFF6FF" : "#fff",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      color: issueLinkForm.accessType === "CRM" ? "var(--dark-blue)" : "#545873",
                    }}
                  >
                    CRM
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueLinkForm((f) => ({ ...f, accessType: "PWA" }))}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: `2px solid ${issueLinkForm.accessType === "PWA" ? "var(--dark-blue)" : "#E4E4EF"}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      background: issueLinkForm.accessType === "PWA" ? "#EFF6FF" : "#fff",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      color: issueLinkForm.accessType === "PWA" ? "var(--dark-blue)" : "#545873",
                    }}
                  >
                    PWA
                  </button>
                </div>
                <div>
                  <label className={classes.addFormLabel}>Email *</label>
                  <input
                    className={classes.addFormInput}
                    style={{ width: "100%", marginTop: 4 }}
                    value={issueLinkForm.email}
                    onChange={(e) => setIssueLinkForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="hotel@example.com"
                    type="email"
                  />
                </div>
                <div>
                  <label className={classes.addFormLabel}>Имя (необязательно)</label>
                  <input
                    className={classes.addFormInput}
                    style={{ width: "100%", marginTop: 4 }}
                    value={issueLinkForm.name}
                    onChange={(e) => setIssueLinkForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Имя представителя"
                  />
                </div>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: "8px 16px 16px" }}>
            <Button backgroundcolor="#F6F7FB" color="#545873" onClick={() => { setIssueLinkState(null); setIssueLinkResult(null); }}>
              Закрыть
            </Button>
            {!issueLinkResult && (
              <Button backgroundcolor="var(--dark-blue)" color="#fff" onClick={handleIssueLink} disabled={issuingLink || saving || !issueLinkForm.email.trim()}>
                Выдать ссылку
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
