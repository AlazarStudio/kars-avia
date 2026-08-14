import React from "react";
import classes from './InfoTableDataNomerFond.module.css';
import InfoTable from "../InfoTable/InfoTable";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

// Чекбокс нативный, а не из MUI: в src/index.css уже описан вид
// input[type="checkbox"] для всего проекта, и он ставит инпуту
// width/height: 20px !important. MUI от этого теряет свой абсолютный оверлей —
// скрытый инпут встаёт в поток РЯДОМ с иконкой, и клик по видимой галке
// пролетает мимо (замер: инпут x=140…160, иконка x=160…180).
const setIndeterminate = (some) => (el) => {
    if (el) el.indeterminate = some;
};

function InfoTableDataNomerFond({ children, user, type, toggleRequestSidebar, requests, openDeleteComponent, toggleRequestEditNumber, onViewNomer, openDeleteNomerComponent, filter, selectedIds, onToggleRoom, onToggleCategory, ...props }) {
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
        return {
            all: total > 0 && picked === total,
            some: picked > 0 && picked < total,
            picked,
        };
    };

    return (
        <>
            <InfoTable>
                <div className={classes.bottom} style={user?.hotelId ? {height: 'calc(100vh - 210px - var(--selection-bar-offset, 0px))'} : {}}>
                    {filteredRequests.map((item, index) => {
                        const selection = categorySelection(item.rooms);

                        return (
                        <div key={index}>
                            <div
                                className={classes.InfoTable_data}
                            >
                                <div className={`${classes.InfoTable_data_elem}`}>
                                    <div className={classes.categoryTitle}>
                                        <input
                                            type="checkbox"
                                            checked={selection.all}
                                            ref={setIndeterminate(selection.some)}
                                            onChange={() => onToggleCategory(item.rooms, !selection.all)}
                                            title="Выделить категорию"
                                        />
                                        <span className={classes.InfoTable_data_elem_title}>{item.name}</span>
                                        {selection.picked > 0 && (
                                            <span className={classes.categoryCount}>
                                                выбрано {selection.picked} из {item.rooms.length}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* <div className={classes.infoTable_buttons}>
                                <img src="/editPassenger.png" alt="" onClick={() => toggleRequestSidebar(item)} />
                                <img src="/deletePassenger.png" alt="" onClick={() => openDeleteComponent(index, item)} />
                            </div> */}

                            </div>
                            <div className={classes.InfoTable_BottomInfo}>
                                <div className={`${classes.InfoTable_BottomInfo__item}`}>
                                    {item.rooms.map((elem, index) => {
                                        const picked = !!selectedIds?.has(elem.id);

                                        return (
                                        <div
                                            className={`${classes.InfoTable_BottomInfo__item___elem} ${picked ? classes.rowPicked : ""}`}
                                            key={index}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={picked}
                                                onChange={() => onToggleRoom(elem.id)}
                                            />
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
                                        );
                                    })}
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
