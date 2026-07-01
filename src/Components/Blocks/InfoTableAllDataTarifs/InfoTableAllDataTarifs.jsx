import React, { useEffect, useMemo, useRef } from "react";
import classes from "./InfoTableAllDataTarifs.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { convertToDate, getMediaUrl } from "../../../../graphQL_requests";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";
import ArchiveIcon from "../../../shared/icons/ArchiveIcon";
import RestoreIcon from "../../../shared/icons/RestoreIcon";

const getExpirationInfo = (item) => {
  if (!item?.contractEndDate) return null;
  const now = new Date();
  const end = new Date(item.contractEndDate);
  const diffMs = end - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (item.isExpired || diffMs <= 0) return { label: "Истёк", color: "var(--red)" };
  if (diffDays <= 90) return { label: `Истекает (${diffDays} дн.)`, color: "#E8A33D" };
  return null;
};

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
    const handleObject = (id) => {
        toggleRequestSidebar(id);
    };

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
        <InfoTable>
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`} style={{justifyContent:'flex-start', padding:'0 10px'}}>№Договора</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w12}`}>Дата заключения</div>
                {id ? null : (<div className={`${classes.InfoTable_title_elem} ${classes.w18}`} style={{justifyContent:'flex-start', padding:'0 10px 0 50px'}}>{activeTab === "airlines" && !id ? "Авиакомпания" : activeTab === "hotels" && !id ? "Гостиница" : "Организация"}</div>)}
                <div className={`${classes.InfoTable_title_elem} ${!id ? classes.w12 : classes.w18}`} style={{justifyContent:'flex-start', padding:'0 10px'}}>{activeTab === "airlines" ? "Вид приложения" : "Вид услуги"}</div>
                <div className={`${classes.InfoTable_title_elem} ${!id ? classes.w12 : classes.w18}`} style={{justifyContent:'flex-start', padding:'0 10px 0 20px'}}>ГК КАРС</div>
                <div className={`${classes.InfoTable_title_elem} ${!id ? classes.w12 : classes.w18}`} style={{justifyContent:'flex-start', padding:'0 10px 0 20px'}}>{activeTab === "airlines" ? "Регион" : "Город"}</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w13}`} style={{justifyContent:'flex-start', padding:'0 10px'}}>Дата окончания</div>
            </div>

            <div className={classes.bottom} style={(user?.airlineId || user?.hotelId) && {height:"calc(100vh - 335px)"}} ref={listContainerRef}>
                {sortedRequests.map((item) => {
                    const exp = getExpirationInfo(item);
                    return (
                    <div
                        className={`${classes.InfoTable_data}`}
                        onClick={() => handleObject(item.id)}
                        key={item.id}
                        style={exp ? { borderLeft: `3px solid ${exp.color}` } : undefined}
                    >
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`} style={{justifyContent:'flex-start', padding:'0 10px'}}>{item.contractNumber}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w12}`} style={{justifyContent:'center'}}>
                            <span>{convertToDate(item.date)}</span>
                        </div>
                        {id ? null : (
                            <div
                                className={`${classes.InfoTable_data_elem} ${classes.w18}`}
                                style={{ justifyContent:'flex-start', textAlign:'left', padding:'0 10px 0 10px' }}
                            >
                                {(() => {
                                    const isHotel = activeTab === "hotels";
                                    const isTransfer = activeTab === "transfer";
                                    const name = isHotel ? item?.hotel?.name : isTransfer ? item?.organization?.name : item?.airline?.name;
                                    const img  = isHotel ? item?.hotel?.images?.[0] : isTransfer ? item?.organization?.images[0] : item?.airline?.images?.[0];

                                    if (!name) return <></>;

                                    return (
                                    <>
                                        {img && (
                                        <div className={classes.InfoTable_data_elem_img}>
                                            <img src={getMediaUrl(img)} alt={name} />
                                        </div>
                                        )}
                                        {name}
                                    </>
                                    );
                                })()}
                            </div>
                        )}
                        <div className={`${classes.InfoTable_data_elem} ${!id ? classes.w12 : classes.w18}`} style={{justifyContent:'flex-start',textAlign:'left'}}>
                            {item.applicationType}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${!id ? classes.w12 : classes.w18}`} style={{justifyContent:'flex-start',textAlign:'left', padding:'0 10px 0 20px'}}>{item?.company?.name}</div>
                        <div
                            className={`${classes.InfoTable_data_elem} ${!id ? classes.w12 : classes.w18}`}
                            style={{justifyContent:'flex-start',textAlign:'left', padding:'0 10px 0 20px'}}
                        >
                            {item?.region?.city ? item.region.city : item.region}
                        </div>
                        <div
                            className={`${classes.InfoTable_data_elem} ${classes.w13}`}
                            style={{flexDirection:'column', gap:2, alignItems:'flex-start', padding:'0 10px'}}
                        >
                            {item.contractEndDate ? (
                                <>
                                    <span>{convertToDate(item.contractEndDate)}</span>
                                    {exp && (
                                        <span style={{ fontSize: 11, color: exp.color }}>{exp.label}</span>
                                    )}
                                </>
                            ) : (
                                <span style={{ opacity: 0.4 }}>—</span>
                            )}
                        </div>
                        {canEdit && (
                          <div
                            className={`${classes.buttonsWrapper} ${classes.w10}`}
                            style={{ gap: 12, padding: "0 12px 0 0" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {archived ? (
                              <span title="Восстановить из архива" style={{ display: "flex" }}>
                                <RestoreIcon
                                    cursor="pointer"
                                    onClick={() => onRestoreContract && onRestoreContract(item)}
                                />
                              </span>
                            ) : (
                              <>
                                <EditPencilIcon
                                    cursor="pointer"
                                    style={{width:"fit-content", height:"fit-content"}}
                                    onClick={() => onEditRow ? onEditRow(item.id) : handleObject(item.id)}
                                />
                                {/* {item.isExpired && onArchiveContract && (
                                  <span title="Перенести в архив" style={{ display: "flex" }}>
                                    <ArchiveIcon
                                        cursor="pointer"
                                        onClick={() => onArchiveContract(item)}
                                    />
                                  </span>
                                )} */}
                                {onArchiveContract && (
                                  <span title="Перенести в архив" style={{ display: "flex" }}>
                                    <ArchiveIcon
                                        cursor="pointer"
                                        onClick={() => onArchiveContract(item)}
                                    />
                                  </span>
                                )}
                              </>
                            )}
                            <DeleteIcon
                                cursor="pointer"
                                onClick={() => {openDeleteContract(item)}}
                            />
                        </div>
                        )}
                    </div>
                    );
                })}
            </div>
        </InfoTable>
    );
}

export default InfoTableAllDataTarifs;
