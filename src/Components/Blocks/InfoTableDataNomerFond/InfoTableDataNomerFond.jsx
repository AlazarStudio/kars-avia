import React from "react";
import Checkbox from "@mui/material/Checkbox";
import classes from './InfoTableDataNomerFond.module.css';
import InfoTable from "../InfoTable/InfoTable";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

function InfoTableDataNomerFond({ children, user, type, toggleRequestSidebar, requests, openDeleteComponent, toggleRequestEditNumber, onViewNomer, openDeleteNomerComponent, filter, selectionMode, selectedIds, onToggleRoom, onToggleCategory, ...props }) {
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

    // Считаем по видимым номерам: галка в шапке выделяет то, что человек видит,
    // а не всю категорию целиком — иначе фильтр и поиск молча заденут лишнее.
    const categorySelection = (rooms) => {
        const total = rooms.length;
        const picked = rooms.filter((room) => selectedIds?.has(room.id)).length;
        return { all: total > 0 && picked === total, some: picked > 0 && picked < total };
    };

    return (
        <>
            <InfoTable>
                <div className={classes.bottom} style={user?.hotelId ? {height: 'calc(100vh - 210px)'} : {}}>
                    {filteredRequests.map((item, index) => {
                        const selection = selectionMode ? categorySelection(item.rooms) : null;

                        return (
                        <div key={index}>
                            <div
                                className={classes.InfoTable_data}
                            >
                                <div className={`${classes.InfoTable_data_elem}`}>
                                    <div className={classes.InfoTable_data_elem_title}>
                                        {selectionMode && (
                                            <Checkbox
                                                size="small"
                                                checked={selection.all}
                                                indeterminate={selection.some}
                                                onChange={() => onToggleCategory(item.rooms, !selection.all)}
                                                sx={{ padding: "0 8px 0 0" }}
                                            />
                                        )}
                                        {item.name}
                                    </div>
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
                                            {selectionMode && (
                                                <Checkbox
                                                    size="small"
                                                    checked={!!selectedIds?.has(elem.id)}
                                                    onChange={() => onToggleRoom(elem.id)}
                                                    sx={{ padding: "0 8px 0 0" }}
                                                />
                                            )}
                                            <span
                                            style={onViewNomer && !selectionMode ? { cursor: "pointer" } : undefined}
                                            onClick={onViewNomer && !selectionMode ? () => onViewNomer(elem, item) : undefined}
                                        >
                                            {elem.type !== 'apartment' ? "№" : ""} {elem.name} {!elem.active && '(не работает)'} {elem?.roomKind?.name}
                                        </span>
                                            {!selectionMode && (
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
                                            )}
                                        </div>

                                    ))}
                                </div>
                            </div>

                        </div>
                        );
                    })}
                </div>
            </InfoTable>
        </>
    );
}

export default InfoTableDataNomerFond;
