import React from "react";
import classes from "./InfoTableDataTarifs.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { roles } from "../../../roles";
import Button from "../../Standart/Button/Button";
import EditPencilIcon from "../../../shared/icons/EditPencilIcon";
import DeleteIcon from "../../../shared/icons/DeleteIcon";

import { CATEGORY_LABELS as categoryMap } from "../../../utils/roomCategories.js";

const VAT_RATE = 0.05;
const VAT_PERCENT = Math.round(VAT_RATE * 100);

const fmtPrice = (n) =>
  typeof n === "number" ? `${Math.round(n).toLocaleString("ru-RU")} ₽` : "—";

const fmtWithVat = (n) =>
  typeof n === "number"
    ? `${Math.round(n * (1 + VAT_RATE)).toLocaleString("ru-RU")} ₽`
    : "—";

function PriceStack({ value, byRequest }) {
  if (byRequest) {
    return (
      <div className={classes.priceStack}>
        <div className={classes.priceBase}>По запросу</div>
        <div className={classes.priceHint}>
          Идёт согласование тарифов и условий размещения — точная стоимость
          будет доступна после уточнения деталей.
        </div>
      </div>
    );
  }
  const isNum = typeof value === "number";
  return (
    <div className={classes.priceStack}>
      <div
        className={`${classes.priceBase} ${isNum ? "" : classes.priceMuted}`}
      >
        {fmtPrice(value)}
      </div>
      <div className={classes.priceVat}>
        с НДС&nbsp;&nbsp;{fmtWithVat(value)}
      </div>
    </div>
  );
}

const VatChipCell = () => (
  <span className={classes.vatChip}>{VAT_PERCENT}%</span>
);

function InfoTableDataTarifs({
  children,
  meal,
  toggleRequestSidebar,
  toggleTarifsCategory,
  toggleAS,
  toggleAdditionalServices,
  toggleEditMealPrices,
  toggleEditTransferPrices,
  requests,
  additionalServices,
  mealPrices,
  transferPrices,
  openDeleteComponent,
  openDeleteComponentCategory,
  openDeleteComponentAS,
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
      <div className={classes.section}>
      <div className={classes.tarifsHeader}>
        <div className={`${classes.headCell} ${classes.w30}`}>Тарифы</div>
        <div className={`${classes.headCell} ${classes.w8}`}>НДС</div>
        {user?.hotelId ? null : (
          <>
            <div className={`${classes.headCell} ${classes.w20}`}>
              Цена по договору
            </div>
            <div className={`${classes.headCell} ${classes.w20}`}>
              Цена для АК
            </div>
          </>
        )}
        <div className={classes.headButtonCell}>
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
              <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                <div className={classes.InfoTable_data_elem_title}>
                  Тариф "{item.name}"
                </div>
                <div className={classes.InfoTable_data_elem_title}>
                  Категория "{categoryMap[item.category] || item.category}"
                </div>
              </div>

              <div className={`${classes.InfoTable_data_elem} ${classes.w8}`}>
                <VatChipCell />
              </div>

              {user?.role != roles.airlineAdmin && (
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <PriceStack value={item.price} />
                </div>
              )}

              {user?.role != roles.hotelAdmin && (
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <PriceStack
                    value={item?.priceForAirline}
                    byRequest={item?.priceForAirReq}
                  />
                </div>
              )}

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
      </div>
      {meal && (
        <div className={classes.section}>
          <div className={classes.tarifsHeader}>
            <div className={`${classes.headCell} ${classes.w30}`}>Питание</div>
            <div className={`${classes.headCell} ${classes.w8}`}>НДС</div>
            {user?.hotelId ? null : (
              <>
                <div className={`${classes.headCell} ${classes.w20}`}>
                  Цена по договору
                </div>
                <div className={`${classes.headCell} ${classes.w20}`}>
                  Цена для АК
                </div>
              </>
            )}
            <div className={classes.headButtonCell}>
              <Button
                onClick={() => toggleEditMealPrices()}
                minwidth={"180px"}
                backgroundcolor={"#fff"}
                color={"var(--text)"}
                border={"1px solid #E4E4EF"}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <EditPencilIcon />
                  Редактировать
                </span>
              </Button>
            </div>
          </div>
          <InfoTable isScroll={true}>
            <div className={classes.bottom}>
              {mealPrices.map((item, index) => (
                <div className={classes.InfoTable_data} key={index}>
                  <div
                    className={`${classes.InfoTable_data_elem} ${classes.w30}`}
                  >
                    <div className={classes.InfoTable_data_elem_title}>
                      {item.name}
                    </div>
                  </div>

                  <div
                    className={`${classes.InfoTable_data_elem} ${classes.w8}`}
                  >
                    <VatChipCell />
                  </div>

                  {user?.role != roles.airlineAdmin && (
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <PriceStack value={item.price} />
                    </div>
                  )}

                  {user?.role != roles.hotelAdmin && (
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <PriceStack
                        value={item.priceForAir}
                        byRequest={item.priceForAirReq}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </InfoTable>
        </div>
      )}
      {transferPrices && transferPrices.length > 0 && (
        <div className={classes.section}>
          <div className={classes.tarifsHeader}>
            <div className={`${classes.headCell} ${classes.w30}`}>Трансфер</div>
            <div className={`${classes.headCell} ${classes.w8}`}>НДС</div>
            {user?.hotelId ? null : (
              <>
                <div className={`${classes.headCell} ${classes.w20}`}>
                  Цена по договору
                </div>
                <div className={`${classes.headCell} ${classes.w20}`}>
                  Цена для АК
                </div>
              </>
            )}
            <div className={classes.headButtonCell}>
              <Button
                onClick={() => toggleEditTransferPrices && toggleEditTransferPrices()}
                minwidth={"180px"}
                backgroundcolor={"#fff"}
                color={"var(--text)"}
                border={"1px solid #E4E4EF"}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <EditPencilIcon />
                  Редактировать
                </span>
              </Button>
            </div>
          </div>
          <InfoTable isScroll={true}>
            <div className={classes.bottom}>
              {transferPrices.map((item, index) => (
                <div className={classes.InfoTable_data} key={index}>
                  <div
                    className={`${classes.InfoTable_data_elem} ${classes.w30}`}
                  >
                    <div className={classes.InfoTable_data_elem_title}>
                      {item.name}
                    </div>
                  </div>

                  <div
                    className={`${classes.InfoTable_data_elem} ${classes.w8}`}
                  >
                    <VatChipCell />
                  </div>

                  {user?.role != roles.airlineAdmin && (
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <PriceStack value={item.price} />
                    </div>
                  )}

                  {user?.role != roles.hotelAdmin && (
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <PriceStack
                        value={item.priceForAir}
                        byRequest={item.priceForAirReq}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </InfoTable>
        </div>
      )}
      <div className={classes.section}>
      <div className={classes.tarifsHeader}>
        <div className={`${classes.headCell} ${classes.w30}`}>
          Дополнительные услуги
        </div>
        <div className={`${classes.headCell} ${classes.w8}`}>НДС</div>
        {user?.hotelId ? null : (
          <>
            <div className={`${classes.headCell} ${classes.w20}`}>
              Цена по договору
            </div>
            <div className={`${classes.headCell} ${classes.w20}`}>
              Цена для АК
            </div>
          </>
        )}
        <div className={classes.headButtonCell}>
          <Button onClick={toggleAS} minwidth={"220px"}>
            Добавить доп услугу
          </Button>
        </div>
      </div>
      <InfoTable isScroll={true}>
        <div className={classes.bottom}>
          {additionalServices.map((item, index) => (
            <div className={classes.InfoTable_data} key={index}>
              <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
                <div className={classes.InfoTable_data_elem_title}>
                  {item.name}
                </div>
              </div>

              <div className={`${classes.InfoTable_data_elem} ${classes.w8}`}>
                <VatChipCell />
              </div>

              {user?.role != roles.airlineAdmin && (
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <PriceStack value={item.price} />
                </div>
              )}

              {user?.role != roles.hotelAdmin && (
                <div
                  className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                >
                  <PriceStack
                    value={item.priceForAirline}
                    byRequest={item.priceForAirReq}
                  />
                </div>
              )}

              <div className={classes.infoTable_buttons}>
                <EditPencilIcon
                  cursor="pointer"
                  onClick={() => {
                    toggleAdditionalServices(item);
                  }}
                />
                {openDeleteComponentAS && (
                  <DeleteIcon
                    cursor="pointer"
                    onClick={() => openDeleteComponentAS(item.id)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </InfoTable>
      </div>
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
