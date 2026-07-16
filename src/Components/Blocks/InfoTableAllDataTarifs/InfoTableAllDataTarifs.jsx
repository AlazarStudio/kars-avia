import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./InfoTableAllDataTarifs.module.css";
import { convertToDate, getMediaUrl } from "../../../../graphQL_requests";
import { getExpirationBadge } from "../../../utils/contractExpiration.js";
import AdditionalAgreementsPopover from "../AdditionalAgreementsPopover/AdditionalAgreementsPopover.jsx";
import ArchiveContractModal from "../ArchiveContractModal/ArchiveContractModal.jsx";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon.jsx";
import ArchiveIcon from "../../../shared/icons/ArchiveIcon.jsx";
import RestoreIcon from "../../../shared/icons/RestoreIcon.jsx";
import DeleteIcon from "../../../shared/icons/DeleteIcon.jsx";
import ProlongIcon from "../../../shared/icons/ProlongIcon.jsx";

function InfoTableAllDataTarifs({
  id,
  user,
  activeTab,
  pageInfo,
  toggleRequestSidebar,
  onEditRow,
  toggleEditTarifsCategory,
  requests,
  openDeleteContract,
  openDeleteComponent,
  openDeleteComponentCategory,
  canEdit = false,
  archived = false,
  onArchiveContract,
  onRestoreContract,
  ...props
}) {
  const handleObject = (rowId) => {
    toggleRequestSidebar(rowId);
  };

  const [archiveTarget, setArchiveTarget] = useState(null);

  const sortedRequests = useMemo(() => {
    if (!requests?.length) return requests;
    const now = new Date();
    const getPriority = (item) => {
      if (!item.contractEndDate) return 2;
      const end = new Date(item.contractEndDate);
      if (item.isExpired || end <= now) return 0;
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 90) return 1;
      return 2;
    };
    return [...requests].sort((a, b) => {
      const pa = getPriority(a);
      const pb = getPriority(b);
      if (pa !== pb) return pa - pb;
      if (a.contractEndDate && b.contractEndDate) {
        return new Date(a.contractEndDate) - new Date(b.contractEndDate);
      }
      return 0;
    });
  }, [requests]);

  const listContainerRef = useRef(null);

  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pageInfo]);

  return (
    <>
      <div className={classes.card}>
        <div className={classes.InfoTable_title}>
          <div className={`${classes.InfoTable_title_elem} ${classes.w10}`} style={{ paddingLeft: 22 }}>
            № Договора
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Дата заключения</div>
          {id ? null : (
            <div className={`${classes.InfoTable_title_elem} ${classes.w18}`}>
              {activeTab === "airlines" ? "Авиакомпания" : activeTab === "hotels" ? "Гостиница" : "Организация"}
            </div>
          )}
          <div className={`${classes.InfoTable_title_elem} ${!id ? classes.w12 : classes.w18}`}>
            {activeTab === "airlines" ? "Предмет договора" : "Вид услуги"}
          </div>
          <div className={`${classes.InfoTable_title_elem} ${!id ? classes.w12 : classes.w18}`}>ГК КАРС</div>
          <div className={`${classes.InfoTable_title_elem} ${!id ? classes.w12 : classes.w18}`}>
            {activeTab === "airlines" ? "Регион" : "Город"}
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w13}`}>Дата окончания</div>
        </div>

        <div
          className={classes.body}
          style={(user?.airlineId || user?.hotelId) ? { height: "calc(100vh - 335px)" } : undefined}
          ref={listContainerRef}
        >
          {sortedRequests?.map((item) => {
            const exp = getExpirationBadge({
              endDate: item.contractEndDate,
              isExpired: item.isExpired,
              daysUntilEnd: item.daysUntilEnd,
            });

            const isHotel = activeTab === "hotels";
            const isTransfer = activeTab === "transfer";
            const entityName = isHotel ? item?.hotel?.name : isTransfer ? item?.organization?.name : item?.airline?.name;
            const entityImg = isHotel ? item?.hotel?.images?.[0] : isTransfer ? item?.organization?.images?.[0] : item?.airline?.images?.[0];

            return (
              <div className={classes.row} onClick={() => handleObject(item.id)} key={item.id}>
                {exp && <span className={classes.bar} style={{ background: exp.color }} />}

                <div className={`${classes.cell} ${classes.cellNum} ${classes.w10}`}>
                  <span className={classes.num}>{item.contractNumber}</span>
                  <AdditionalAgreementsPopover agreements={item.additionalAgreements} />
                </div>

                <div className={`${classes.cell} ${classes.w12}`}>
                  <span className={classes.muted}>{convertToDate(item.date)}</span>
                </div>

                {id ? null : (
                  <div className={`${classes.cell} ${classes.entity} ${classes.w18}`}>
                    {entityName ? (
                      <>
                        <div className={classes.avatar}>
                          {entityImg ? (
                            <img src={getMediaUrl(entityImg)} alt={entityName} />
                          ) : (
                            (entityName[0] || "").toUpperCase()
                          )}
                        </div>
                        <span className={classes.entityName}>{entityName}</span>
                      </>
                    ) : null}
                  </div>
                )}

                <div className={`${classes.cell} ${!id ? classes.w12 : classes.w18}`}>
                  {item.applicationType}
                </div>

                <div className={`${classes.cell} ${!id ? classes.w12 : classes.w18}`}>
                  {item?.company?.name}
                </div>

                <div className={`${classes.cell} ${!id ? classes.w12 : classes.w18}`}>
                  {item?.region?.city ? item.region.city : item.region}
                </div>

                <div className={`${classes.cell} ${classes.cellEnd} ${classes.w13}`}>
                  {item.contractEndDate ? (
                    <span className={classes.endDate}>{convertToDate(item.contractEndDate)}</span>
                  ) : (
                    <span className={classes.dash}>—</span>
                  )}
                  {exp && (
                    <span className={classes.expPill} style={{ background: exp.bg, color: exp.textColor }}>
                      <span className={classes.expDot} style={{ background: exp.color }} />
                      {exp.label}
                    </span>
                  )}
                  {item.isProlongationEnabled && (
                    <span className={classes.prolong}>
                      <ProlongIcon width={12} height={12} strokeWidth={1.8} color="currentColor" cursor="pointer" />
                      Пролонгация
                    </span>
                  )}
                </div>

                {canEdit && (
                  <div className={`${classes.actions} ${classes.w10}`} onClick={(e) => e.stopPropagation()}>
                    {archived ? (
                      <button
                        type="button"
                        title="Восстановить из архива"
                        className={classes.actBtn}
                        onClick={() => onRestoreContract && onRestoreContract(item)}
                      >
                        <RestoreIcon width={17} height={17} strokeWidth={1} color="currentColor" cursor="pointer" />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          title="Редактировать"
                          className={classes.actBtn}
                          onClick={() => (onEditRow ? onEditRow(item.id) : handleObject(item.id))}
                        >
                          <EditPencilIcon width={17} height={18} strokeWidth={1} color="currentColor" cursor="pointer" />
                        </button>
                        {onArchiveContract && (
                          <button
                            type="button"
                            title="Перенести в архив"
                            className={classes.actBtn}
                            onClick={() => setArchiveTarget(item)}
                          >
                            <ArchiveIcon width={17} height={17} strokeWidth={1} color="currentColor" cursor="pointer" />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      title="Удалить"
                      className={`${classes.actBtn} ${classes.actBtnDanger}`}
                      onClick={() => openDeleteContract(item)}
                    >
                      <DeleteIcon width={17} height={17} strokeWidth={1} color="currentColor" cursor="pointer" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {archiveTarget && (
        <ArchiveContractModal
          number={archiveTarget.contractNumber}
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() => {
            onArchiveContract && onArchiveContract(archiveTarget);
            setArchiveTarget(null);
          }}
        />
      )}
    </>
  );
}

export default InfoTableAllDataTarifs;
