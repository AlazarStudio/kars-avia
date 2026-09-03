import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./PositionAccessPage.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_AIRLINE_USERS_POSITIONS,
  GET_DISPATCHER_POSITIONS,
  CREATE_POSITION,
  UPDATE_POSITION,
  DELETE_POSITION,
  getCookie,
} from "../../../../graphQL_requests";
import Header from "../Header/Header";
import MUILoader from "../MUILoader/MUILoader";
import MUISwitch from "../MUISwitch/MUISwitch";
import MUITextField from "../MUITextField/MUITextField";
import AccessPermissionsPanel from "../SettingsSidebar/AccessPermissionsPanel";
import Button from "../../Standart/Button/Button";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";
import { useToast } from "../../../contexts/ToastContext";
import { useDialog } from "../../../contexts/DialogContext";
import { buildAccessPayload, ALL_TRUE_ACCESS } from "../../../utils/accessPayload";
import { canAccessMenu, canManageAirlineAccess } from "../../../utils/access";

export default function PositionAccessPage({ user, accessMenu }) {
  const token = getCookie("token");
  const ctx = {
    headers: { Authorization: `Bearer ${token}`, "Apollo-Require-Preflight": true },
  };
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: notifyError } = useToast();
  const { confirm } = useDialog();

  // Контекст (тип/авиакомпания/посев) приходит из navigate state; есть фолбэк
  // на случай прямого открытия по URL.
  const type = location.state?.type || (user?.airlineId ? "airline" : "dispatcher");
  const airlineId = location.state?.airlineId || user?.airlineId;
  const seedAccessMenu = location.state?.seedAccessMenu;
  const isAirline = type === "airline";
  // АК-контекст диспетчер-админ правит по роли; свой (dispatcher) — по ключу.
  const canManageAccess = isAirline
    ? canManageAirlineAccess(accessMenu, user)
    : canAccessMenu(accessMenu, "accessManage", user);

  const { data, loading, refetch } = useQuery(
    isAirline ? GET_AIRLINE_USERS_POSITIONS : GET_DISPATCHER_POSITIONS,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      skip: isAirline && !airlineId,
      variables: isAirline ? { airlineId } : {},
      fetchPolicy: "cache-and-network",
    }
  );

  const positions = useMemo(() => {
    const list = isAirline ? data?.getAirlineUserPositions : data?.getDispatcherPositions;
    return (list || [])
      .slice()
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ru", { sensitivity: "base" }));
  }, [data, isAirline]);

  const [createPosition] = useMutation(CREATE_POSITION, { context: ctx });
  const [updatePosition] = useMutation(UPDATE_POSITION, { context: ctx });
  const [deletePosition] = useMutation(DELETE_POSITION, { context: ctx });

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [inherit, setInherit] = useState(true);
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "edit"
  const [formId, setFormId] = useState(null);
  const [formName, setFormName] = useState("");

  const selected = useMemo(
    () => positions.find((p) => p.id === selectedId) || null,
    [positions, selectedId]
  );

  const seed = useMemo(
    () => (seedAccessMenu && Object.keys(seedAccessMenu).length ? seedAccessMenu : ALL_TRUE_ACCESS),
    [seedAccessMenu]
  );

  useEffect(() => {
    if (selected) setInherit(!selected.accessMenu);
  }, [selected]);

  const detailMenu = useMemo(() => {
    if (!selected) return {};
    return selected.accessMenu || seed;
  }, [selected, seed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return positions;
    return positions.filter((p) => p.name?.toLowerCase().includes(q));
  }, [positions, search]);

  const ownCount = useMemo(
    () => positions.filter((p) => !!p.accessMenu).length,
    [positions]
  );

  const handleSaveAccess = async () => {
    if (!selected) return;
    // Защита от гонки: панель пишет своё состояние в panelRef в эффекте после
    // маунта. Если наследование только что выключили (свой доступ) и сохранили
    // в том же кадре, panelRef.current ещё null → buildAccessPayload(null) дал бы
    // все права в false.
    if (!inherit && !panelRef.current) {
      notifyError("Права ещё загружаются, попробуйте ещё раз.");
      return;
    }
    try {
      setSaving(true);
      const accessMenu = inherit ? null : buildAccessPayload(panelRef.current);
      await updatePosition({
        variables: { input: { id: selected.id, name: selected.name, accessMenu } },
      });
      await refetch();
      success("Доступ должности сохранён.");
    } catch (e) {
      console.error("updatePosition (access) error:", e);
      notifyError("Не удалось сохранить доступ должности.");
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setFormMode("create");
    setFormId(null);
    setFormName("");
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setFormMode("edit");
    setFormId(p.id);
    setFormName(p.name || "");
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    const name = formName.trim();
    if (!name) {
      notifyError("Введите название должности.");
      return;
    }
    try {
      setSaving(true);
      if (formMode === "create") {
        const input = isAirline
          ? { name, separator: "airlineUser", airlineId }
          : { name, separator: "dispatcher" };
        await createPosition({ variables: { input } });
        success("Должность создана.");
      } else {
        await updatePosition({ variables: { input: { id: formId, name } } });
        success("Должность переименована.");
      }
      setFormOpen(false);
      await refetch();
    } catch (e) {
      console.error("position form error:", e);
      notifyError("Не удалось сохранить должность.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    const ok = await confirm({
      message: `Удалить должность «${p.name}»? Назначенную пользователям должность удалить нельзя.`,
      confirmText: "Удалить",
      cancelText: "Отмена",
    });
    if (!ok) return;
    try {
      await deletePosition({ variables: { id: p.id } });
      if (selectedId === p.id) setSelectedId(null);
      await refetch();
      success("Должность удалена.");
    } catch (e) {
      const code = e?.graphQLErrors?.[0]?.extensions?.code;
      if (code === "POSITION_IN_USE") {
        notifyError("Нельзя удалить: должность назначена пользователям.");
      } else {
        console.error("deletePosition error:", e);
        notifyError("Не удалось удалить должность.");
      }
    }
  };

  return (
    <div className={classes.section}>
      <Header>
        <div className={classes.titleHeader}>
          <button
            type="button"
            className={classes.backButton}
            onClick={() => navigate(-1)}
            aria-label="Назад"
          >
            <img src="/arrow.png" alt="" />
          </button>
          Должности и доступ
        </div>
      </Header>

      <div className={classes.body}>
        {/* Левая панель — список должностей */}
        <aside className={classes.listPanel}>
          <div className={classes.listTop}>
            <div className={classes.listTitleRow}>
              <span className={classes.listTitle}>Должности</span>
              <span className={classes.countBadge}>{positions.length}</span>
            </div>
            <MUITextField
              label="Поиск должности"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className={classes.addBtn}
              onClick={openCreate}
            >
              <span className={classes.addPlus}>+</span> Добавить должность
            </button>
            {ownCount > 0 && (
              <div className={classes.listHint}>
                Со своим доступом: {ownCount} из {positions.length}
              </div>
            )}
          </div>

          <div className={classes.listScroll}>
            {loading && (
              <div className={classes.listLoader}>
                <MUILoader />
              </div>
            )}

            {!loading &&
              filtered.map((p) => {
                const active = selectedId === p.id;
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    className={`${classes.li} ${active ? classes.liActive : ""}`}
                    onClick={() => setSelectedId(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(p.id);
                      }
                    }}
                  >
                    <span className={classes.liName} title={p.name}>
                      {p.name}
                    </span>
                    <span className={classes.liRight}>
                      <span
                        className={`${classes.badge} ${p.accessMenu ? classes.badgeOwn : classes.badgeInherit}`}
                      >
                        {p.accessMenu ? "свой доступ" : "наследует"}
                      </span>
                      <span
                        className={classes.iconBtn}
                        role="button"
                        tabIndex={0}
                        aria-label="Переименовать должность"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(p);
                        }}
                      >
                        <EditPencilIcon cursor="pointer" />
                      </span>
                      <span
                        className={classes.iconBtn}
                        role="button"
                        tabIndex={0}
                        aria-label="Удалить должность"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p);
                        }}
                      >
                        <DeleteIcon cursor="pointer" />
                      </span>
                    </span>
                  </div>
                );
              })}

            {!loading && filtered.length === 0 && (
              <div className={classes.listEmpty}>
                {search ? "Ничего не найдено." : "Должностей пока нет."}
              </div>
            )}
          </div>
        </aside>

        {/* Правая панель — доступ выбранной должности */}
        <section className={classes.detailPanel}>
          {!selected && (
            <div className={classes.detailEmpty}>
              <div className={classes.detailEmptyMark} aria-hidden="true" />
              <div className={classes.detailEmptyTitle}>Выберите должность</div>
              <div className={classes.detailEmptyText}>
                Слева выберите должность, чтобы настроить её доступ. По умолчанию
                должность наследует доступ отдела.
              </div>
            </div>
          )}

          {selected && (
            <div className={classes.detailInner}>
              <div className={classes.detailHeader}>
                <span className={classes.detailName}>{selected.name}</span>
                <span
                  className={`${classes.headBadge} ${inherit ? classes.headBadgeInherit : classes.headBadgeOwn}`}
                >
                  {inherit ? "наследует доступ отдела" : "свой доступ"}
                </span>
              </div>

              <div className={classes.detailBody}>
                <div className={classes.inheritRow}>
                  <div className={classes.inheritText}>
                    <div className={classes.inheritTitle}>Наследовать доступ отдела</div>
                    <div className={classes.inheritDesc}>
                      Если выключить — у должности будет собственный доступ,
                      приоритетный над доступом отдела.
                    </div>
                  </div>
                  <MUISwitch
                    label=""
                    checked={inherit}
                    onChange={(e) => setInherit(e.target.checked)}
                  />
                </div>

                <div className={classes.sectionsLabel}>Доступ к разделам</div>

                <div className={classes.gridWrap}>
                  <AccessPermissionsPanel
                    key={selected.id}
                    accessMenu={detailMenu}
                    stateRef={panelRef}
                    isEditing={!inherit}
                    type={type}
                    canManageAccess={canManageAccess}
                  />
                  {inherit && (
                    <div className={classes.lockOverlay}>
                      <span className={classes.lockPill}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                        Доступ наследуется от отдела
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={classes.saveRow}>
                <Button onClick={handleSaveAccess} disabled={saving}>
                  Сохранить
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {formOpen && (
        <div className={classes.modalBackdrop} onClick={() => setFormOpen(false)}>
          <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
            <div className={classes.modalTitle}>
              {formMode === "create" ? "Новая должность" : "Переименовать должность"}
            </div>
            <MUITextField
              label="Название должности"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <div className={classes.modalActions}>
              <Button
                onClick={() => setFormOpen(false)}
                backgroundcolor="#F1F4FB"
                color="#545873"
              >
                Отмена
              </Button>
              <Button onClick={handleFormSubmit} disabled={saving}>
                {formMode === "create" ? "Создать" : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
