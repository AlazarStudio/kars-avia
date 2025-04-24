import React from "react";
import classes from "./InfoTableAirlineDataTarifs.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { roles } from "../../../roles";

function InfoTableAirlineDataTarifs({
  toggleRequestSidebar,
  toggleEditTarifsCategory,
  toggleEditMealPrices,
  requests,
  mealPrices,
  user,
  ...props
}) {
  return (
    <div className={classes.tarifsWrapper}>
      <InfoTable isScroll={true}>
        <div className={classes.contractsContainer}>
          {requests.map((item, index) => (
            <div className={classes.contractRow} key={index}>
              {/* Заголовок договора и иконки действий */}
              <div className={classes.contractRowHeader}>
                <span>{item.name}</span>
                <div className={classes.contractRowActions}>
                  <img
                    src="/editPassenger.png"
                    alt="Редактировать договор"
                    onClick={() => toggleEditTarifsCategory(item)}
                  />
                </div>
              </div>

              {/* Ряд с категориями цен */}
              {user?.role !== roles.airlineAdmin && (
                <div className={classes.pricesRow}>
                  {item.prices?.priceApartment !== undefined && (
                    <div
                      className={classes.priceItem}
                    >
                      <span className={classes.priceItemLabel}>Апартаменты</span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceApartment} ₽
                      </span>
                    </div>
                  )}
                  {item.prices?.priceStudio !== undefined && (
                    <div className={classes.priceItem}>
                      <span className={classes.priceItemLabel}>Студия</span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceStudio} ₽
                      </span>
                    </div>
                  )}
                  {item.prices?.priceOneCategory !== undefined && (
                    <div className={classes.priceItem}>
                      <span className={classes.priceItemLabel}>
                        Одноместный
                      </span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceOneCategory} ₽
                      </span>
                    </div>
                  )}
                  {item.prices?.priceTwoCategory !== undefined && (
                    <div className={classes.priceItem}>
                      <span className={classes.priceItemLabel}>
                        Двухместный
                      </span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceTwoCategory} ₽
                      </span>
                    </div>
                  )}
                  {item.prices?.priceThreeCategory !== undefined && (
                    <div className={classes.priceItem}>
                      <span className={classes.priceItemLabel}>
                        Трехместный
                      </span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceThreeCategory} ₽
                      </span>
                    </div>
                  )}
                  {item.prices?.priceFourCategory !== undefined && (
                    <div className={classes.priceItem}>
                      <span className={classes.priceItemLabel}>
                        Четырехместный
                      </span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceFourCategory} ₽
                      </span>
                    </div>
                  )}
                  {item.prices?.priceFiveCategory !== undefined && (
                    <div className={classes.priceItem}>
                      <span className={classes.priceItemLabel}>
                        Пятиместный
                      </span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceFiveCategory} ₽
                      </span>
                    </div>
                  )}
                  {item.prices?.priceSixCategory !== undefined && (
                    <div className={classes.priceItem}>
                      <span className={classes.priceItemLabel}>
                        Шестиместный
                      </span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceSixCategory} ₽
                      </span>
                    </div>
                  )}
                  {item.prices?.priceSevenCategory !== undefined && (
                    <div className={classes.priceItem}>
                      <span className={classes.priceItemLabel}>
                        Семиместный
                      </span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceSevenCategory} ₽
                      </span>
                    </div>
                  )}
                  {item.prices?.priceEightCategory !== undefined && (
                    <div className={classes.priceItem}>
                      <span className={classes.priceItemLabel}>
                        Восьмиместный
                      </span>
                      <span className={classes.priceItemValue}>
                        {item.prices.priceEightCategory} ₽
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Блок аэропортов (если есть) */}
              {item.airports && item.airports.length > 0 && (
                <div className={classes.airportList}>
                  <div className={classes.airportListTitle}>Аэропорты:</div>
                  {item.airports.map((airportItem) => (
                    <div key={airportItem.id} className={classes.airportItem}>
                      {airportItem.airport.city} — {airportItem.airport.name}{" "}
                      {airportItem.airport.code &&
                        `(${airportItem.airport.code})`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </InfoTable>

      {/* Блок «Питание - цены» остаётся без изменений */}
      <InfoTable isScroll={true}>
        {/* Используем старые стили */}
        <div className={classes.bottom}>
          {mealPrices.map((item, index) => (
            <div className={classes.InfoTable_data} key={index}>
              <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                <div className={classes.InfoTable_data_elem_title}>
                  {item.name}
                </div>
              </div>
              {user?.role !== roles.airlineAdmin && (
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <div className={classes.InfoTable_data_elem_title}>
                    {item.price} ₽
                  </div>
                </div>
              )}
              <div className={classes.infoTable_buttons}>
                <img
                  src="/editPassenger.png"
                  alt="Редактировать питание"
                  onClick={() => toggleEditMealPrices(item)}
                />
              </div>
            </div>
          ))}
        </div>
      </InfoTable>
    </div>
  );
}

export default InfoTableAirlineDataTarifs;

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
// import classes from "./InfoTableAirlineDataTarifs.module.css";
// import InfoTable from "../InfoTable/InfoTable";
// import { roles } from "../../../roles";

// function InfoTableAirlineDataTarifs({
//   children,
//   toggleRequestSidebar,
//   toggleEditMealPrices,
//   requests,
//   mealPrices,
//   openDeleteComponent,
//   openDeleteComponentCategory,
//   toggleEditTarifsCategory,
//   user,
//   ...props
// }) {
//   // console.log(requests);

//   return (
//     <div className={classes.tarifsWrapper}>
//       Категории - цены
//       <InfoTable isScroll={true}>
//         <div className={classes.bottom}>
//           {requests.map((item, index) => (
//             <div className={classes.InfoTable_data} key={index}>
//               <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
//                 <div className={classes.InfoTable_data_elem_title}>
//                   Категория "{item.name}"
//                 </div>
//               </div>

//               {user?.role != roles.airlineAdmin && (
//                 <div
//                   className={`${classes.InfoTable_data_elem} ${classes.w20}`}
//                 >
//                   <div className={classes.InfoTable_data_elem_title}>
//                     {item.price} ₽
//                   </div>
//                 </div>
//               )}

//               {/* {user?.role != "HOTELADMIN" &&
//                                 <div className={`${classes.InfoTable_data_elem} ${classes.w20}`}>
//                                     <div className={classes.InfoTable_data_elem_title}>Стоимость для авиакомпаний</div>
//                                 </div>
//                             } */}

//               <div className={classes.infoTable_buttons}>
//                 <img
//                   src="/editPassenger.png"
//                   alt=""
//                   onClick={() => {
//                     toggleRequestSidebar(item);
//                   }}
//                 />
//                 {/* <img src="/deletePassenger.png" alt="" onClick={() => openDeleteComponent(index, item.id)} /> */}
//               </div>
//             </div>
//           ))}
//         </div>
//       </InfoTable>
//       Питание - цены
//       <InfoTable isScroll={true}>
//         <div className={classes.bottom}>
//           {mealPrices.map((item, index) => (
//             <div className={classes.InfoTable_data} key={index}>
//               <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
//                 <div className={classes.InfoTable_data_elem_title}>
//                   {item.name}
//                 </div>
//               </div>

//               {user?.role != roles.airlineAdmin && (
//                 <div
//                   className={`${classes.InfoTable_data_elem} ${classes.w20}`}
//                 >
//                   <div className={classes.InfoTable_data_elem_title}>
//                     {item.price} ₽
//                   </div>
//                 </div>
//               )}

//               <div className={classes.infoTable_buttons}>
//                 <img
//                   src="/editPassenger.png"
//                   alt=""
//                   onClick={() => {
//                     toggleEditMealPrices(item);
//                   }}
//                 />
//               </div>
//             </div>
//           ))}
//         </div>
//       </InfoTable>
//     </div>
//   );
// }

// export default InfoTableAirlineDataTarifs;
