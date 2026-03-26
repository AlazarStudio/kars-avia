import React from "react";
import classes from "./InfoTableDataTarifs.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { roles } from "../../../roles";
import Button from "../../Standart/Button/Button";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

const categoryMap = {
  luxe: "Люкс",
  apartment: "Апартаменты",
  studio: "Студия",
  onePlace: "Одноместный",
  twoPlace: "Двухместный",
  threePlace: "Трехместный",
  fourPlace: "Четырехместный",
  fivePlace: "Пятиместный",
  sixPlace: "Шестиместный",
  sevenPlace: "Семиместный",
  eightPlace: "Восьмиместный",
  ninePlace: "Девятиместный",
  tenPlace: "Десятиместный",
};

function InfoTableDataTarifs({
  children,
  meal,
  toggleRequestSidebar,
  toggleTarifsCategory,
  toggleAS,
  toggleAdditionalServices,
  toggleEditMealPrices,
  requests,
  additionalServices,
  mealPrices,
  openDeleteComponent,
  openDeleteComponentCategory,
  toggleEditTarifsCategory,
  user,
  height,
  ...props
}) {
  // console.log(requests);

  return (
    <div
      className={classes.tarifsWrapper}
      style={height ? { height: height } : {}}
    >
      <div className={classes.tarifsHeader}>
        <div className={classes.w40}>Тарифы</div>
        {user?.hotelId ? null : (
          <>
            <div className={classes.w20}>Цена по договору</div>
            <div className={classes.w20}>Цена для АК</div>
          </>
        )}
        <div
          // className={classes.w20}
          style={{ display: "flex", justifyContent: "flex-end", flex: 1 }}
        >
          <Button
            onClick={toggleTarifsCategory}
            // maxWidth={"300px"}
            minwidth={"220px"}
          >
            Добавить тариф
          </Button>
        </div>
      </div>
      <InfoTable isScroll={true}>
        <div className={classes.bottom}>
          {requests?.map((item, index) => (
            <div className={classes.InfoTable_data} key={index}>
              <div className={`${classes.InfoTable_data_elem} ${classes.w40}`}>
                <div className={classes.InfoTable_data_elem_title}>
                  Тариф "{item.name}"
                </div>
                <div className={classes.InfoTable_data_elem_title}>
                  Категория "{categoryMap[item.category] || item.category}"
                </div>
              </div>

              {user?.role != roles.airlineAdmin && (
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <div className={classes.InfoTable_data_elem_title}>
                    {item.price.toLocaleString()} ₽
                  </div>
                </div>
              )}

              {user?.role != roles.hotelAdmin && (
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <div className={classes.InfoTable_data_elem_title}>
                    {item?.priceForAirline?.toLocaleString()} ₽
                  </div>
                </div>
              )}

              {/* {user?.role != "HOTELADMIN" &&
                                <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
                                    <div className={classes.InfoTable_data_elem_title}>Стоимость для авиакомпаний</div>
                                </div>
                            } */}

              <div className={classes.infoTable_buttons}>
                <EditPencilIcon
                  cursor="pointer"
                  onClick={() => {
                    toggleRequestSidebar(item);
                  }}
                />
                <DeleteIcon
                  cursor="pointer"
                  onClick={() => openDeleteComponent(index, item.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </InfoTable>
      {meal && (
        <>
          <div className={classes.tarifsHeader}>
            <div className={classes.w40}>Питание</div>
            {user?.hotelId ? null : (
              <>
                <div className={classes.w20}>Цена по договору</div>
                <div className={classes.w20}>Цена для АК</div>
              </>
            )}
          </div>
          <InfoTable isScroll={true}>
            <div className={classes.bottom}>
              {mealPrices.map((item, index) => (
                <div className={classes.InfoTable_data} key={index}>
                  <div
                    className={`${classes.InfoTable_data_elem} ${classes.w40}`}
                  >
                    <div className={classes.InfoTable_data_elem_title}>
                      {item.name}
                    </div>
                  </div>

                  {user?.role != roles.airlineAdmin && (
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <div className={classes.InfoTable_data_elem_title}>
                        {item.price?.toLocaleString()} ₽
                      </div>
                    </div>
                  )}

                  {user?.role != roles.hotelAdmin && (
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <div className={classes.InfoTable_data_elem_title}>
                        {item.priceForAir?.toLocaleString()} ₽
                      </div>
                    </div>
                  )}

                  <div className={classes.infoTable_buttons}>
                    <EditPencilIcon
                      cursor="pointer"
                      onClick={() => {
                        toggleEditMealPrices(item);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </InfoTable>
        </>
      )}
      <div className={classes.tarifsHeader}>
        <div className={classes.w40}>Дополнительные услуги</div>
        {user?.hotelId ? null : (
          <>
            <div className={classes.w20}>Цена по договору</div>
            <div className={classes.w20}>Цена для АК</div>
          </>
        )}
        <div
          // className={classes.w20}
          style={{ display: "flex", justifyContent: "flex-end", flex: 1 }}
        >
          <Button onClick={toggleAS} minwidth={"220px"}>
            Добавить доп услугу
          </Button>
        </div>
      </div>
      <InfoTable isScroll={true}>
        <div className={classes.bottom}>
          {additionalServices.map((item, index) => (
            <div className={classes.InfoTable_data} key={index}>
              <div className={`${classes.InfoTable_data_elem} ${classes.w40}`}>
                <div className={classes.InfoTable_data_elem_title}>
                  {item.name}
                </div>
              </div>

              {user?.role != roles.airlineAdmin && (
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <div className={classes.InfoTable_data_elem_title}>
                    {item.price?.toLocaleString()} ₽
                  </div>
                </div>
              )}

              {user?.role != roles.hotelAdmin && (
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <div className={classes.InfoTable_data_elem_title}>
                    {item.priceForAirline?.toLocaleString()} ₽
                  </div>
                </div>
              )}

              <div className={classes.infoTable_buttons}>
                <EditPencilIcon
                  cursor="pointer"
                  onClick={() => {
                    toggleAdditionalServices(item);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </InfoTable>
    </div>
  );
}

export default InfoTableDataTarifs;

{
  /* <div className={classes.InfoTable_BottomInfo}>
    {item.category && [...item.category].sort((a, b) => a.name.localeCompare(b.name)).map((category, index) => (
        <div className={`${classes.InfoTable_BottomInfo__item}`} key={index}>
            <div className={classes.infoTableData_items}>
                <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{category.name}</div>

                {user?.role != "AIRLINEADMIN" &&
                    <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{category.prices.length > 0 && category.prices[0].amount} р / сутки</div>
                }

                {user?.role != "HOTELADMIN" &&
                    <div className={`${classes.InfoTable_BottomInfo__item___elem} ${classes.w20}`}>{category.prices.length > 0 && category.prices[0].amountair} р / сутки</div>
                }
            </div>
            <div className={classes.infoTableData_buttons}>
                <img src="/editPassenger.png" alt="" onClick={() => toggleEditTarifsCategory(category, item)} />
                <img src="/deletePassenger.png" alt="" onClick={() => openDeleteComponentCategory(category, item)} />
            </div>
        </div>
    ))}
</div> */
}

// import React from "react";
// import classes from './InfoTableDataTarifs.module.css';
// import InfoTable from "../InfoTable/InfoTable";
// import { roles } from "../../../roles";

// function InfoTableDataTarifs({ children, toggleRequestSidebar, toggleEditMealPrices, requests, mealPrices, openDeleteComponent, openDeleteComponentCategory, toggleEditTarifsCategory, user, ...props }) {
//     // console.log(requests);

//     return (
//         <div className={classes.tarifsWrapper}>
//             Категории - цены
//             <InfoTable isScroll={true}>
//                 <div className={classes.bottom}>
//                     {requests.map((item, index) => (
//                         <div className={classes.InfoTable_data} key={index} >
//                             <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
//                                 <div className={classes.InfoTable_data_elem_title}>Категория "{item.name}"</div>
//                             </div>

//                             {user?.role != roles.airlineAdmin &&
//                                 <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
//                                     <div className={classes.InfoTable_data_elem_title}>{item.price} ₽</div>
//                                 </div>
//                             }

//                             {/* {user?.role != "HOTELADMIN" &&
//                                 <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
//                                     <div className={classes.InfoTable_data_elem_title}>Стоимость для авиакомпаний</div>
//                                 </div>
//                             } */}

//                             <div className={classes.infoTable_buttons}>
//                                 <img src="/editPassenger.png" alt="" onClick={() => { toggleRequestSidebar(item) }} />
//                                 {/* <img src="/deletePassenger.png" alt="" onClick={() => openDeleteComponent(index, item.id)} /> */}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </InfoTable>

//             Питание - цены
//             <InfoTable isScroll={true}>
//                 <div className={classes.bottom}>
//                     {mealPrices.map((item, index) => (
//                         <div className={classes.InfoTable_data} key={index} >
//                             <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
//                                 <div className={classes.InfoTable_data_elem_title}>{item.name}</div>
//                             </div>

//                             {user?.role != roles.airlineAdmin &&
//                                 <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
//                                     <div className={classes.InfoTable_data_elem_title}>{item.price} ₽</div>
//                                 </div>
//                             }

//                             <div className={classes.infoTable_buttons}>
//                                 <img src="/editPassenger.png" alt="" onClick={() => { toggleEditMealPrices(item) }} />
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </InfoTable>
//         </div>
//     );
// }

// export default InfoTableDataTarifs;
