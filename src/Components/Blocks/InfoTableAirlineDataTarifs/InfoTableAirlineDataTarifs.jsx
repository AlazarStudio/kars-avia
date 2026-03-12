// import React, { useEffect, useState } from "react";
// import classes from "./InfoTableAirlineDataTarifs.module.css";
// import { roles } from "../../../roles";
// import AttachIcon from "../../../shared/icons/AttachIcon";
// import BackArrowIcon from "../../../shared/icons/BackArrowIcon";

// function InfoTableAirlineDataTarifs({
//   toggleRequestSidebar,
//   toggleEditTarifsCategory,
//   toggleEditMealPrices,
//   requests,
//   refetch,
//   dataSubscriptionUpd,
//   dataSubscriptionAirUpd,
//   mealPrices,
//   toggleTarifs,
//   user,
//   selectedContract,
//   onOpenContract,
//   onBack, // назад к списку договоров
//   openDeleteComponent,
//   openDeleteComponentCategory,
//   ...props
// }) {
//   // локальный выбор доп. соглашения (airlinePrices[])
//   const [selectedAgreement, setSelectedAgreement] = useState(null);
//   // console.log(dataSubscriptionAirUpd);
  
//   useEffect(() => {
//     if (dataSubscriptionAirUpd) {
//       // console.log(dataSubscriptionAirUpd);
      
//       setSelectedAgreement(dataSubscriptionAirUpd?.airlineUpdated?.prices?.find(i => i?.id === selectedAgreement?.id))
//     }
//   }, [dataSubscriptionAirUpd]);

//   // console.log(selectedAgreement);
  
//   // ====== Уровень 2: Детали выбранного доп. соглашения ======
//   if (selectedContract && selectedAgreement) {
//     const a = selectedAgreement;

//     return (
//       <div className={classes.detailsWrapper}>
//         <div className={classes.detailsHeaderCard}>
//           <div className={classes.detailsTitle}>
//             <BackArrowIcon
//               onClick={() => setSelectedAgreement(null)}
//               width={20}
//               height={14}
//             />
//             {a.name}
//           </div>
//           <div className={classes.detailsActions}>
//             {/* при необходимости подставьте ссылку на скачивание именно соглашения */}
//             {/* <button className={classes.primaryBtn} onClick={() => window.open(a.downloadUrl, "_blank")}>
//               <img src="/downloadManifest.png" alt="" /> Скачать
//             </button> */}
//             {/* <AttachIcon width={19} height={19} /> */}
//             <img
//               src="/editPassenger.png"
//               alt="Редактировать договор"
//               title="Редактировать"
//               onClick={() => toggleRequestSidebar(a)}
//             />
//           </div>
//         </div>

//         {/* Категории — цены */}
//         {user?.role !== roles.hotelAdmin && (
//           <>
//             <div className={classes.blockTitle}>Категории — цены</div>
//             <div className={classes.pricesRow}>
//               {a.prices?.priceApartment !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Апартаменты</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceApartment?.toLocaleString()} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceStudio !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Студия</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceStudio?.toLocaleString() ?? 0} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceLuxe !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Люкс</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceLuxe?.toLocaleString() ?? 0} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceOneCategory !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Одноместный</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceOneCategory?.toLocaleString()} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceTwoCategory !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Двухместный</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceTwoCategory?.toLocaleString()} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceThreeCategory !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Трехместный</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceThreeCategory?.toLocaleString()} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceFourCategory !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Четырехместный</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceFourCategory?.toLocaleString()} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceFiveCategory !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Пятиместный</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceFiveCategory?.toLocaleString()} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceSixCategory !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Шестиместный</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceSixCategory?.toLocaleString()} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceSevenCategory !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Семиместный</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceSevenCategory?.toLocaleString()} ₽
//                   </span>
//                 </div>
//               )}
//               {a.prices?.priceEightCategory !== undefined && (
//                 <div className={classes.priceItem}>
//                   <span className={classes.priceItemLabel}>Восьмиместный</span>
//                   <span className={classes.priceItemValue}>
//                     {a.prices.priceEightCategory?.toLocaleString()} ₽
//                   </span>
//                 </div>
//               )}
//             </div>
//           </>
//         )}

//         {/* Питание — цены */}
//         <div className={classes.blockTitle}>Питание — цены</div>
//         <div className={classes.pricesRow}>
//           {a.mealPrice?.breakfast !== undefined && (
//             <div className={classes.priceItem}>
//               <span className={classes.priceItemLabel}>Завтрак</span>
//               <span className={classes.priceItemValue}>
//                 {a.mealPrice?.breakfast?.toLocaleString()} ₽
//               </span>
//             </div>
//           )}
//           {a.mealPrice?.lunch !== undefined && (
//             <div className={classes.priceItem}>
//               <span className={classes.priceItemLabel}>Обед</span>
//               <span className={classes.priceItemValue}>
//                 {a.mealPrice?.lunch?.toLocaleString()} ₽
//               </span>
//             </div>
//           )}
//           {a.mealPrice?.dinner !== undefined && (
//             <div className={classes.priceItem}>
//               <span className={classes.priceItemLabel}>Ужин</span>
//               <span className={classes.priceItemValue}>
//                 {a.mealPrice?.dinner?.toLocaleString()} ₽
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Аэропорты */}
//         {a.airports && a.airports.length > 0 && (
//           <>
//             <div className={classes.airportListTitle}>Аэропорты:</div>
//             <div className={classes.pricesRow}>
//               {a.airports.map((ap) => (
//                 <div className={classes.priceItem} key={ap.id}>
//                   <span className={classes.priceItemLabel}>
//                     {ap.airport.code || ""}
//                   </span>
//                   <span className={classes.priceItemValue}>
//                     {ap.airport.city} — {ap.airport.name}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}
//       </div>
//     );
//   }

//   // ====== Уровень 1: Карточка договора с плитками доп. соглашений ======
//   if (selectedContract) {
//     const contract = selectedContract;

//     return (
//       <div className={classes.detailsWrapper}>
//         <div className={classes.detailsHeaderCard}>
//           <div className={classes.detailsTitle}>
//             <BackArrowIcon onClick={onBack} width={20} height={14} />
//             {contract.name}
//           </div>
//           <div className={classes.detailsActions}>
//             {/* <button
//               className={classes.primaryBtn}
//               onClick={() => window.open(contract.downloadUrl, "_blank")}
//             >
//               <img src="/downloadManifest.png" alt="" /> Скачать договор
//             </button> */}
//             {/* <AttachIcon width={19} height={19} /> */}
//             <img
//               src="/editPassenger.png"
//               alt="Редактировать договор"
//               title="Редактировать"
//               onClick={() => toggleEditTarifsCategory(contract)}
//             />
//             {/* <img
//               src="/deletePassenger.png"
//               alt="Удалить договор"
//               title="Удалить"
//               onClick={() => toggleEditTarifsCategory(contract)}
//             /> */}
//           </div>
//         </div>

//         <div className={classes.blockTitle}>
//           Дополнительные соглашения{" "}
//           <div className={classes.addStaff} onClick={toggleTarifs}>
//             <img src="/plus.png" alt="" />
//           </div>
//         </div>
//         <div className={classes.agreementsRow}>
//           {/* <div className={classes.priceItem}>
//               <span className={classes.priceItemLabel}>Завтрак</span>
//               <span className={classes.priceItemValue}>
//                 {a.mealPrice?.breakfast?.toLocaleString()} ₽
//               </span>
//             </div> */}
//           {contract.airlinePrices?.map((ag) => (
//             <div
//               key={ag.id}
//               className={classes.airportItem}
//               onClick={() => setSelectedAgreement(ag)}
//             >
//               <div
//                 className={classes.priceItemLabel}
//                 style={{ textAlign: "center" }}
//               >
//                 {ag.name}
//               </div>
//               {/* лёгкий саммари — можно убрать/заменить */}
//               {/* <div className={classes.agreementMeta}>
//                 {(ag.prices?.priceOneCategory ??
//                   ag.prices?.priceTwoCategory ??
//                   ag.prices?.priceApartment ??
//                   0) > 0 && (
//                   <span>
//                     от{" "}
//                     {(ag.prices.priceOneCategory ??
//                       ag.prices.priceTwoCategory ??
//                       ag.prices.priceApartment
//                     )?.toLocaleString()}{" "}
//                     ₽
//                   </span>
//                 )}
//                 {ag.mealPrice &&
//                   (ag.mealPrice.breakfast ||
//                     ag.mealPrice.lunch ||
//                     ag.mealPrice.dinner) && <span>• питание</span>}
//               </div> */}
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   // ====== Список договоров ======
//   return (
//     <div className={classes.contracts}>
//       {requests?.map((item, index) => (
//         <div
//           className={classes.contractRow}
//           key={item.id}
//           onClick={() => onOpenContract(item)}
//         >
//           <div className={classes.contractRowHeader}>
//             <span className={classes.contractRowTitle}>{item.name}</span>
//             <div
//               className={classes.contractRowActions}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <img
//                 src="/editPassenger.png"
//                 alt="Редактировать договор"
//                 title="Редактировать"
//                 onClick={() => toggleEditTarifsCategory(item)}
//               />
//               {/* <img
//                 src="/deletePassenger.png"
//                 alt="Удалить договор"
//                 title="Удалить"
//                 onClick={() => toggleEditTarifsCategory(item)}
//               /> */}
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default InfoTableAirlineDataTarifs;

 import React, { useState } from "react";
 import classes from "./InfoTableAirlineDataTarifs.module.css";
 import InfoTable from "../InfoTable/InfoTable";
 import { roles } from "../../../roles";

 function InfoTableAirlineDataTarifs({
   toggleRequestSidebar,
   toggleEditTarifsCategory,
   onDeleteTarifsCategory,
   toggleEditMealPrices,
   requests,
   mealPrices,
   user,
   ...props
 }) {
   const [expandedRows, setExpandedRows] = useState(new Set());

   const toggleRow = (index) => {
     setExpandedRows((prev) => {
       const newSet = new Set(prev);
       if (newSet.has(index)) {
         newSet.delete(index);
       } else {
         newSet.add(index);
       }
       return newSet;
     });
   };

   return (
     <div className={classes.tarifsWrapper}>
         <div className={classes.contractsContainer}>
           {requests.map((item, index) => (
             <div className={classes.contractRow} key={index}>
               {/* Заголовок договора и иконки действий */}
               <div className={classes.contractRowHeader}>
                 <div className={classes.contractRowHeaderLeft}>
                   <div
                     className={`${classes.expandButton} ${expandedRows.has(index) ? classes.expanded : ""}`}
                     onClick={() => toggleRow(index)}
                   >
                     <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M1.5 1L6.5 6L1.5 11" stroke="#545873" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                   </div>
                   <span>{item.name}</span>
                 </div>
                 <div className={classes.contractRowActions}>
                   <img
                     src="/editPassenger.png"
                     alt="Редактировать договор"
                     title="Редактировать"
                     onClick={() => toggleEditTarifsCategory(item)}
                   />
                   {onDeleteTarifsCategory && item.id && (
                     <img
                       src="/deletePassenger.png"
                       alt="Удалить договор"
                       title="Удалить"
                       onClick={() => onDeleteTarifsCategory(item)}
                     />
                   )}
                 </div>
               </div>

               {expandedRows.has(index) && (
                 <>
               {/* <p style={{ marginTop: "10px" }}>Категории - цены</p> */}
               <div className={classes.airportListTitle}>Категории - цены</div>
               {/* Ряд с категориями цен */}
               {user?.role !== roles.hotelAdmin && (
                 <div className={classes.pricesRow}>
                   {item.prices?.priceApartment !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>
                         Апартаменты
                       </span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceApartment?.toLocaleString()} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceStudio !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>Студия</span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceStudio?.toLocaleString() ?? 0} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceLuxe !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>Люкс</span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceLuxe?.toLocaleString() ?? 0} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceOneCategory !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>
                         Одноместный
                       </span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceOneCategory?.toLocaleString()} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceTwoCategory !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>
                         Двухместный
                       </span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceTwoCategory?.toLocaleString()} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceThreeCategory !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>
                         Трехместный
                       </span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceThreeCategory?.toLocaleString()} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceFourCategory !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>
                         Четырехместный
                       </span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceFourCategory?.toLocaleString()} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceFiveCategory !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>
                         Пятиместный
                       </span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceFiveCategory?.toLocaleString()} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceSixCategory !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>
                         Шестиместный
                       </span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceSixCategory?.toLocaleString()} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceSevenCategory !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>
                         Семиместный
                       </span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceSevenCategory?.toLocaleString()} ₽
                       </span>
                     </div>
                   )}
                   {item.prices?.priceEightCategory !== undefined && (
                     <div className={classes.priceItem}>
                       <span className={classes.priceItemLabel}>
                         Восьмиместный
                       </span>
                       <span className={classes.priceItemValue}>
                         {item.prices.priceEightCategory?.toLocaleString()} ₽
                       </span>
                     </div>
                   )}
                 </div>
               )}

               {/* <p style={{ marginTop: "10px" }}>Питание - цены</p> */}
               <div className={classes.airportListTitle}>Питание - цены</div>
               <div className={classes.pricesRow}>
                 {item.mealPrice?.breakfast !== undefined && (
                   <div className={classes.priceItem}>
                     <span className={classes.priceItemLabel}>Завтрак</span>
                     <span className={classes.priceItemValue}>
                       {item.mealPrice?.breakfast?.toLocaleString()} ₽
                     </span>
                   </div>
                 )}
                 {item.mealPrice?.lunch !== undefined && (
                   <div className={classes.priceItem}>
                     <span className={classes.priceItemLabel}>Обед</span>
                     <span className={classes.priceItemValue}>
                       {item.mealPrice?.lunch?.toLocaleString()} ₽
                     </span>
                   </div>
                 )}
                 {item.mealPrice?.dinner !== undefined && (
                   <div className={classes.priceItem}>
                     <span className={classes.priceItemLabel}>Ужин</span>
                     <span className={classes.priceItemValue}>
                       {item.mealPrice?.dinner?.toLocaleString()} ₽
                     </span>
                   </div>
                 )}
               </div>

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
                 </>
               )}
             </div>
           ))}
         </div>

       {/* <InfoTable isScroll={true}>
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
       </InfoTable> */}
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
