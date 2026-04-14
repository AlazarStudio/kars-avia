import React from "react";
import classes from './InfoTableDataNomerFond.module.css';
import InfoTable from "../InfoTable/InfoTable";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

function InfoTableDataNomerFond({ children, user, type, toggleRequestSidebar, requests, openDeleteComponent, toggleRequestEditNumber, onViewNomer, openDeleteNomerComponent, filter, ...props }) {
    const buildFilteredRequests = (reserveFilter) => {
        const result = [];
        requests.forEach((item) => {
            const filteredRooms =
                reserveFilter === "all"
                    ? item.rooms
                    : item.rooms.filter(
                          (room) =>
                              room.reserve === (reserveFilter === "reserve")
                      );
            if (filteredRooms.length > 0) {
                result.push({ ...item, rooms: filteredRooms });
            }
        });
        return result;
    };

    const filteredRequests = buildFilteredRequests(filter || "all");

    return (
        <>
            <InfoTable>
                <div className={classes.bottom} style={user?.hotelId ? {height: 'calc(100vh - 210px)'} : {}}>
                    {filteredRequests.map((item, index) => (
                        <div key={index}>
                            <div
                                className={classes.InfoTable_data}
                            >
                                <div className={`${classes.InfoTable_data_elem}`}>
                                    <div className={classes.InfoTable_data_elem_title}>{item.name}</div>
                                </div>

                                {/* <div className={classes.infoTable_buttons}>
                                <img src="/editPassenger.png" alt="" onClick={() => toggleRequestSidebar(item)} />
                                <img src="/deletePassenger.png" alt="" onClick={() => openDeleteComponent(index, item)} />
                            </div> */}

                            </div>
                            <div className={classes.InfoTable_BottomInfo}>
                                <div className={`${classes.InfoTable_BottomInfo__item}`}>
                                    {item.rooms.map((elem, index) => (
                                        <div className={`${classes.InfoTable_BottomInfo__item___elem}`} key={index}>
                                            <span
                                            style={onViewNomer ? { cursor: "pointer" } : undefined}
                                            onClick={onViewNomer ? () => onViewNomer(elem, item) : undefined}
                                        >
                                            {elem.type !== 'apartment' ? "№" : ""} {elem.name} {!elem.active && '(не работает)'} {elem?.roomKind?.name}
                                        </span>
                                            <div className={classes.infoTable_buttons}>
                                                <EditPencilIcon
                                                    cursor="pointer"
                                                    onClick={() => toggleRequestEditNumber(elem, item)}
                                                />
                                                <DeleteIcon
                                                    cursor="pointer"
                                                    onClick={() => openDeleteNomerComponent(elem, item.name)}
                                                />
                                            </div>
                                        </div>

                                    ))}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </InfoTable>
        </>
    );
}

export default InfoTableDataNomerFond;
