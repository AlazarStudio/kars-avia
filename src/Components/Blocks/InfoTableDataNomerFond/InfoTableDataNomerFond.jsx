import React, { useState } from "react";
import classes from './InfoTableDataNomerFond.module.css';
import InfoTable from "../InfoTable/InfoTable";

function InfoTableDataNomerFond({ children, toggleRequestSidebar, requests, openDeleteComponent, toggleRequestEditNumber, openDeleteNomerComponent, ...props }) {
    const [filter, setFilter] = useState('quote');

    const quotaRequests = [];
    const reserveRequests = [];

    requests.forEach(item => {
        item.rooms.forEach(room => {
            // Проверяем, является ли комната квотной
            if (room.reserve === false) {
                // Найдем, существует ли уже такой запрос с таким же category
                const existingRequest = quotaRequests.find(r => r.rooms[0]?.category === room.category);

                if (existingRequest) {
                    // Если такой запрос уже есть, добавляем комнату в существующий запрос
                    existingRequest.rooms.push(room);
                } else {
                    // Если запроса с таким origName еще нет, создаем новый
                    quotaRequests.push({
                        ...item, // Копируем все данные item
                        rooms: [room] // В rooms добавляем только эту комнату
                    });
                }
            }

            // Проверяем, является ли комната резервной
            if (room.reserve === true) {
                // Найдем, существует ли уже такой запрос с таким же category
                const existingRequest = reserveRequests.find(r => r.rooms[0]?.category === room.category);

                if (existingRequest) {
                    // Если такой запрос уже есть, добавляем комнату в существующий запрос
                    existingRequest.rooms.push(room);
                } else {
                    // Если запроса с таким origName еще нет, создаем новый
                    reserveRequests.push({
                        ...item, // Копируем все данные item
                        rooms: [room] // В rooms добавляем только эту комнату
                    });
                }
            }
        });
    });

    // // Фильтрация по полю "reserve" в каждом элементе "rooms"
    // const filteredRequests = requests.filter(item => {
    //     // Проверка на фильтрацию по "reserve" или "quote"
    //     if (filter === 'reserve') {
    //         // Если фильтр "reserve", показываем только те комнаты, у которых reserve === true
    //         return item.rooms.some(room => room.reserve === true); // ищем хотя бы одну комнату с reserve: true
    //     } else if (filter === 'quote') {
    //         // Если фильтр "quote", показываем только те комнаты, у которых reserve === false
    //         return item.rooms.some(room => room.reserve === false); // ищем хотя бы одну комнату с reserve: false
    //     }
    //     return true; // Если фильтр не задан, показываем все
    // });

    const filteredRequests = filter === 'quote' ? quotaRequests : reserveRequests;

    return (
        <>
            <div className={classes.filter_wrapper}>
                <button onClick={() => setFilter('quote')} className={filter === 'quote' ? classes.activeButton : null}>Квота</button>
                <button onClick={() => setFilter('reserve')} className={filter === 'reserve' ? classes.activeButton : null}>Резерв</button>
            </div>
            <InfoTable>
                <div className={classes.bottom}>
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
                                            {elem.name} {!elem.active && '(не работает)'}
                                            <div className={classes.infoTable_buttons}>
                                                <img src="/editPassenger.png" alt="" onClick={() => toggleRequestEditNumber(elem, item)} />
                                                <img src="/deletePassenger.png" alt="" onClick={() => openDeleteNomerComponent(elem, item.name)} />
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
