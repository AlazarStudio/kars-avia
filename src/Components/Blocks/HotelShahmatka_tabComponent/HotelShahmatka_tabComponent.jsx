import React, { useState } from "react";
// import HotelTablePageComponent from "../HotelTablePageComponent/HotelTablePageComponent";

import { CANCEL_REQUEST, getCookie } from '../../../../graphQL_requests.js';
import { useMutation } from "@apollo/client";
import NewPlacementV2 from "../../PlacementDNDV2/NewPlacementV2.jsx";
import CreateRequest from "../CreateRequest/CreateRequest.jsx";
import ExistRequest from "../ExistRequest/ExistRequest.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";

function HotelShahmatka_tabComponent({ id, user, accessMenu }) {
    const token = getCookie("token")

      const [showCreateRequest, setShowCreateRequest] = useState(false);
      const [showRequestSidebar, setShowRequestSidebar] = useState(false);
      const [existRequestData, setExistRequestData] = useState(null); // Для хранения данных match
      const [showDelete, setShowDelete] = useState(false);
    
      // console.log(type);
    
      const toggleCreateRequest = () => {
        setShowCreateRequest((prev) => !prev);
      };
      const toggleRequestSidebar = () => setShowRequestSidebar(!showRequestSidebar);
    
      const openDeleteComponent = () => {
        setShowDelete(true);
      };
    
      const closeDeleteComponent = () => {
        setShowDelete(false);
      };
    
      const handleOpenExistRequest = (matchData) => {
        setExistRequestData(matchData); // Сохраняем данные match
        setShowRequestSidebar(true); // Открываем ExistRequest
      };
    
      // Запрос на отмену созданной, но не размещенной заявки
      const [cancelRequestMutation] = useMutation(CANCEL_REQUEST, {
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
    
      const handleCancelRequest = async (id) => {
        try {
          // Отправка запроса с правильным ID заявки
          const response = await cancelRequestMutation({
            variables: {
              cancelRequestId: id,
            },
          });
          // console.log("Заявка успешно отменена", response);
        } catch (error) {
          console.error("Ошибка при отмене заявки:", JSON.stringify(error));
        }
      };

    // const { loading, error, data } = useQuery(GET_HOTEL_ROOMS, {
    //             context: {
    //         headers: {
    //             Authorization: `Bearer ${token}`
    //         },
    //     },
    //     variables: { hotelId: id },
    // });

    // const dataObject = [
    //     {
    //         room: '',
    //         place: '',
    //         start: '',
    //         startTime: '',
    //         end: '',
    //         endTime: '',
    //         client: '',
    //         public: false,
    //     }
    // ];

    // let allRooms = [];

    // data && data.hotel.rooms.map((item) => (
    //     allRooms.push({
    //         room: item.name,
    //         places: item.places
    //     })
    // ));

    // allRooms.sort((a, b) => a.room.localeCompare(b.room));

    // const placesArray = allRooms.map(room => room.places);
    // const uniquePlacesArray = [...new Set(placesArray)];
    // uniquePlacesArray.sort((a, b) => a - b);

    // const [hotelBronsInfo, setHotelBronsInfo] = useState([]);

    // const { loading: bronLoading, error: bronError, data: bronData } = useQuery(GET_BRONS_HOTEL, {
    //     context: {
    //         headers: {
    //             Authorization: `Bearer ${token}`
    //         },
    //     },
    //     variables: { hotelId: id },
    // });

    // useEffect(() => {
    //     if (bronData && bronData.hotel && bronData.hotel.hotelChesses) {
    //         setHotelBronsInfo(bronData.hotel.hotelChesses);
    //     }
    // }, [bronData]);

    // Поиск переехал в панель инструментов доски (BoardToolbar внутри NewPlacementV2)

    // const handleSelect = (e) => {
    //     setSelectQuery(e.target.value);
    // }

    // const toggleSidebar = () => {
    //     setShowAddBronForm(!showAddBronForm);
    // }

    // const filteredRequests = allRooms.filter(request => {
    //     const matchesRoom = request.room.toLowerCase().includes(searchQuery.toLowerCase());
    //     const matchesPlaces = selectQuery === '' || request.places === parseInt(selectQuery);

    //     const matchingClients = hotelBronsInfo.filter(entry =>
    //         entry.client?.name && entry.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    //         entry.room === request.room
    //     );

    //     const matchesClient = matchingClients.length > 0;

    //     return (matchesRoom || matchesClient) && matchesPlaces;
    // });


    // if (loading || bronLoading) return <MUILoader fullHeight={'70vh'}/>;
    // if (error || bronError) return <p>Error: {error ? error.message : bronError.message}</p>;
    return (
        <>
            {/* <div className={classes.legend}>
                    <div className={classes.legendLine}>
                        <div className={classes.legendInfo} style={{ border: '1px solid #fff', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#9e9e9e' }}></div>
                            <div className={classes.legendInfoText}> Создан</div>
                        </div>
                        <div className={classes.legendInfo} style={{ border: '1px solid #fff', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#2196f3' }}></div>
                            <div className={classes.legendInfoText}> Продлен</div>
                        </div>
                    </div>

                    <div className={classes.legendLine}>
                        <div className={classes.legendInfo} style={{ border: '1px solid #fff', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#4caf50' }}></div>
                            <div className={classes.legendInfoText}> Забронирован</div>
                        </div>

                        <div className={classes.legendInfo} style={{ border: '1px solid #fff', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#9575cd' }}></div>
                            <div className={classes.legendInfoText}> Ранний заезд</div>
                        </div>
                    </div>

                    <div className={classes.legendLine}>
                        <div className={classes.legendInfo} style={{ border: '1px solid #fff', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#ff9800' }}></div>
                            <div className={classes.legendInfoText}> Перенесен</div>
                        </div>
                        <div className={classes.legendInfo} style={{ border: '1px solid #fff', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#f44336' }}></div>
                            <div className={classes.legendInfoText}> Сокращен</div>
                        </div>
                    </div>

                    <div className={classes.legendLine}>
                        <div className={classes.legendInfo} style={{ border: '1px solid #fff', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#638ea4' }}></div>
                            <div className={classes.legendInfoText}> Готов к архиву</div>
                        </div>
                        <div className={classes.legendInfo} style={{ border: '1px solid #fff', width: '130px' }}>
                            <div className={classes.legendInfoColor} style={{ backgroundColor: '#3b653d' }}></div>
                            <div className={classes.legendInfoText}> Архив</div>
                        </div>
                    </div>
                </div> */}

            {/* <div className={classes.section_searchAndFilter_filter}>
                    <select onChange={handleSelect}>
                        <option value="">Показать все</option>
                        {uniquePlacesArray.map((item, index) => (
                            <option value={`${item}`} key={index}>{item} - МЕСТНЫЕ</option>
                        ))}
                    </select>
                    <div onClick={toggleSidebar}>Добавить бронь</div>
                </div>*/}

            {/* {isPlacementV2 ? (
              <NewPlacement idHotelInfo={id} searchQuery={searchQuery} user={user} />
            ) : (
              <NewPlacementV2 idHotelInfo={id} searchQuery={searchQuery} user={user} />
            )} */}

            <NewPlacementV2
              idHotelInfo={id}
              user={user}
              accessMenu={accessMenu}
              onCreateRequest={toggleCreateRequest}
            />

            {/* {(hotelBronsInfo.length === 0) &&
                <HotelTablePageComponent maxHeight={"635px"} allRooms={filteredRequests} data={[]} idHotel={id} dataObject={dataObject} id={'hotels'} showAddBronForm={showAddBronForm} />
            }

            {(hotelBronsInfo.length !== 0) &&
                <HotelTablePageComponent maxHeight={"635px"} allRooms={filteredRequests} data={hotelBronsInfo} idHotel={id} dataObject={dataObject} id={'hotels'} showAddBronForm={showAddBronForm} />
            } */}

      <CreateRequest
        show={showCreateRequest}
        onClose={toggleCreateRequest}
        user={user}
        onMatchFound={handleOpenExistRequest}
        // addNotification={...}
      />
      <ExistRequest
        // setChooseCityRequest={setChooseCityRequest}
        show={showRequestSidebar}
        onClose={toggleRequestSidebar}
        // setChooseRequestID={setChooseRequestID}
        // setShowChooseHotel={setShowChooseHotel}
        chooseRequestID={existRequestData}
        handleCancelRequest={handleCancelRequest}
        user={user}
        openDeleteComponent={openDeleteComponent}
        // setRequestId={setChooseRequestId}
      />
      {showDelete && (
        <DeleteComponent
          remove={() => {
            handleCancelRequest(existRequestData);
            closeDeleteComponent();
            setShowRequestSidebar(false);
            setExistRequestData(null);
          }}
          index={existRequestData}
          close={closeDeleteComponent}
          title={`Вы действительно хотите отменить заявку? `}
          isCancel={true}
        />
      )}

        </>
    );
}

export default HotelShahmatka_tabComponent;
