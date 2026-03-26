import React, { useCallback, useEffect, useRef, useState } from "react";
import classes from "./InfoTableAllDataTarifs.module.css";
import { roles } from "../../../roles";
import AttachIcon from "../../../shared/icons/AttachIcon";
import BackArrowIcon from "../../../shared/icons/BackArrowIcon";
import InfoTable from "../InfoTable/InfoTable";
import { convertToDate, getMediaUrl } from "../../../../graphQL_requests";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

function InfoTableAllDataTarifs({
  id,
  user,
  activeTab,
  pageInfo,
  toggleRequestSidebar,
  toggleEditTarifsCategory,
  requests,
  openDeleteContract,
  openDeleteComponent,
  openDeleteComponentCategory,
  canEdit = false,
  ...props
}) {
    // Функция для установки выбранного объекта и переключения боковой панели
    const handleObject = (id, arrival, departure, person, requestNumber) => {
        // setChooseRequestID(id);
        toggleRequestSidebar(id);
    };

    // Ref для контейнера списка
    const listContainerRef = useRef(null);

    // Прокрутка наверх при изменении `pageInfo`
    useEffect(() => {
      if (listContainerRef.current) {
          listContainerRef.current.scrollTo({
              top: 0,
              behavior: "instant",
          });
      }
    }, [pageInfo]);

    // useEffect(() => {
    //     if (!scrollToId || !listContainerRef.current) return;
    //     const el = listContainerRef.current.querySelector(`[data-id="${scrollToId}"]`);
    //     if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    // }, [scrollToId, requests]);

    // console.log(requests);
    

    return (
        <InfoTable>
            {/* Заголовки колонок */}
            <div className={classes.InfoTable_title}>
                <div className={`${classes.InfoTable_title_elem} ${classes.w10}`} style={{justifyContent:'flex-start', padding:'0 10px'}}>№Договора</div>
                <div className={`${classes.InfoTable_title_elem} ${classes.w15}`} >Дата заключения</div>
                {id ? null : (<div className={`${classes.InfoTable_title_elem} ${classes.w20}`} style={{justifyContent:'flex-start', padding:'0 10px 0 50px'}}>{activeTab === "airlines" && !id ? "Авиакомпания" : activeTab === "hotels" && !id ? "Гостиница" : "Организация"}</div>)}
                <div className={`${classes.InfoTable_title_elem} ${!id ? classes.w15 : classes.w20}`} style={{justifyContent:'flex-start', padding:'0 10px'}}>{activeTab === "airlines" ? "Вид приложения" : "Вид услуги"}</div>
                <div className={`${classes.InfoTable_title_elem} ${!id ? classes.w15 : classes.w20}`} style={{justifyContent:'flex-start', padding:'0 10px 0 20px'}}>ГК КАРС</div>
                <div className={`${classes.InfoTable_title_elem} ${!id ? classes.w15 : classes.w20}`} style={{justifyContent:'flex-start', padding:'0 10px 0 20px'}}>{activeTab === "airlines" ? "Регион" : "Город"}</div>
            </div>

            {/* Данные о заявках */}
            <div className={classes.bottom} style={(user?.airlineId || user?.hotelId) && {height:"calc(100vh - 335px)"}} ref={listContainerRef}>
                {requests.map((item, index) => (
                    <div
                        className={`${classes.InfoTable_data}`}
                        onClick={() => handleObject(item.id)}
                        key={index}
                        // data-id={item.id}
                    >
                        <div className={`${classes.InfoTable_data_elem} ${classes.w10}`} style={{justifyContent:'flex-start', padding:'0 10px'}}>{item.contractNumber}</div>
                        <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>{convertToDate(item.date)}</div>
                        {/* <div className={`${classes.InfoTable_data_elem} ${classes.w20}`} style={{ justifyContent:'flex-start',textAlign:'left', padding:'0 10px 0 30px'}}>
                            <div className={classes.InfoTable_data_elem_img} >
                                <img src={`${server}${ activeTab !== "hotels" ? item?.airline?.images[0] : item?.hotel?.images[0]}`} alt="" />
                            </div>
                            {activeTab !== "hotels" ? item?.airline?.name : item?.hotel?.name}
                        </div> */}
                        {id ? null : (
                            <div
                                className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                                style={{ justifyContent:'flex-start', textAlign:'left', padding:'0 10px 0 10px' }}
                            >
                                {(() => {
                                    const isHotel = activeTab === "hotels";
                                    const isTransfer = activeTab === "transfer";
                                    const name = isHotel ? item?.hotel?.name : isTransfer ? item?.organization?.name : item?.airline?.name;
                                    const img  = isHotel ? item?.hotel?.images?.[0] : isTransfer ? item?.organization?.images[0] : item?.airline?.images?.[0];

                                    if (!name) {
                                    return <></>;
                                    }

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
                        <div className={`${classes.InfoTable_data_elem} ${!id ? classes.w15 : classes.w20}`} style={{justifyContent:'flex-start',textAlign:'left'}}>
                            {item.applicationType}
                        </div>
                        <div className={`${classes.InfoTable_data_elem} ${!id ? classes.w15 : classes.w20}`} style={{justifyContent:'flex-start',textAlign:'left', padding:'0 10px 0 20px'}}>{item?.company?.name}</div>
                        <div 
                            className={`${classes.InfoTable_data_elem} ${!id ? classes.w15 : classes.w20}`} 
                            style={{justifyContent:'flex-start',textAlign:'left', padding:'0 10px 0 20px'}}
                        >
                            {item?.region?.city ? item.region.city : item.region}
                        </div>
                        {canEdit && (

                          <div className={`${classes.buttonsWrapper} ${classes.w10}`} onClick={(e) => e.stopPropagation()}>
                            <EditPencilIcon
                                cursor="pointer"
                                style={{width:"fit-content", height:"fit-content"}}
                                onClick={() => handleObject(item.id)}
                            />
                            <DeleteIcon
                                cursor="pointer"
                                onClick={() => {openDeleteContract(item)}}
                            />
                        </div>
                        )}
                    </div>
                ))}
            </div>
        </InfoTable>
    );
}

export default InfoTableAllDataTarifs;
