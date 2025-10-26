import React, { useEffect, useRef } from "react";
import classes from "./InfoTableDataHotels.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { Link } from "react-router-dom";
import { server } from "../../../../graphQL_requests";

function InfoTableDataHotels({
  children,
  toggleRequestSidebar,
  requests,
  pageInfo,
  ...props
}) {
  const handleObject = (item, index) => {
    toggleRequestSidebar();
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

  return (
    <InfoTable>
      <div className={classes.InfoTable_title}>
        <div className={`${classes.InfoTable_title_elem} ${classes.w5}`} style={{alignItems:"center"}}>ID</div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}></div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w25}`}>Название</div>
        {/* <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Город</div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Оценка</div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Звёздность</div> */}
        <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>Адрес</div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Номерной фонд</div>
        {/* <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Удалённость</div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>Квота</div>
        <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>Резерв</div> */}
      </div>

      <div className={classes.bottom} ref={listContainerRef}>
        {requests.map((item, index) => (
          <Link
            to={`/hotels/${item.id}`}
            className={classes.InfoTable_data}
            onClick={() => handleObject(item, index)}
            key={index}
          >
            <div
              className={`${classes.InfoTable_data_elem} ${classes.w5}`}
              style={{ alignItems: "center" }}
            >
              <span className={classes.blue}>{item.order}</span>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
              <div className={classes.InfoTable_data_elem_userInfo}>
                <div className={classes.InfoTable_data_elem_avatar}>
                  <img
                    loading="lazy"
                    src={
                      item.images.length != 0
                        ? `${server}${item.images}`
                        : "/no-avatar.png"
                    }
                    alt=""
                  />
                </div>
              </div>
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w25}`}>
              <div className={classes.InfoTable_data_elem_title}>
                {item.name}
              </div>
              {item.stars ? (
                <div className={classes.InfoTable_data_elem_title}>
                  <>
                    <p>{item.stars ? `Оценка ${item.stars}` : ""}</p>
                    <div>
                      <img src={"/star.png"} className={classes.star} />
                      {/* {Array.from({ length: 5 }, (_, index) => (
                        <img
                          key={index}
                          src={
                            index < item.stars ? "/star.png" : "/op_star.png"
                          }
                          className={classes.star}
                        />
                      ))} */}
                    </div>
                  </>
                </div>
              ) : null}
              {item.usStars ? (
                <div className={classes.InfoTable_data_elem_title}>
                  <>
                    <p>{item.usStars ? `Звёздность ${item.usStars}` : ""}</p>
                    <div>
                      <img src={"/star.png"} className={classes.star} />

                      {/* {Array.from({ length: 5 }, (_, index) => (
                        <img
                          key={index}
                          src={
                            index < item.usStars ? "/star.png" : "/op_star.png"
                          }
                          className={classes.star}
                        />
                      ))} */}
                    </div>
                  </>
                </div>
              ) : null}
            </div>
            <div className={`${classes.InfoTable_data_elem} ${classes.w30}`}>
              <div className={classes.InfoTable_data_elem_title}>
                {item.information?.city}
              </div>
              {item.information?.address ? (
                <div className={classes.InfoTable_data_elem_title} style={{paddingRight:'20px'}}>
                  {item.information?.address}
                </div>
              ) : null}
              {item?.airportDistance ? (
                <div className={classes.InfoTable_data_elem_title}>
                  До аэропорта
                  <span
                    className={classes.blue}
                  >{`${item.airportDistance} мин`}</span>
                </div>
              ) : null}
            </div>
            {/* <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>

            </div> */}
            {/* <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>

            </div> */}
            <div
              className={`${classes.InfoTable_data_elem} ${classes.w15}`}
              style={{ justifyContent: "flex-start" }}
            >
              <div className={classes.InfoTable_data_elem_title}>
                Квота{" "}
                <span className={classes.blue}>
                  {item.quote ? item.quote : "0"}
                </span>
              </div>
              <div className={classes.InfoTable_data_elem_title}>
                Резерв{" "}
                <span className={classes.blue}>
                  {item.provision ? item.provision : "0"}
                </span>
              </div>
              <div className={classes.InfoTable_data_elem_title}>
                Мощность{" "}
                <span className={classes.blue}>
                  {item.capacity ? item.capacity : "0"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </InfoTable>
  );
}

export default InfoTableDataHotels;

// import React, { useEffect, useRef } from "react";
// import classes from "./InfoTableDataHotels.module.css";
// import InfoTable from "../InfoTable/InfoTable";
// import { Link } from "react-router-dom";
// import { server } from "../../../../graphQL_requests";

// function InfoTableDataHotels({
//   children,
//   toggleRequestSidebar,
//   requests,
//   pageInfo,
//   ...props
// }) {
//   const handleObject = (item, index) => {
//     toggleRequestSidebar();
//   };

//   // Ref для контейнера списка
//   const listContainerRef = useRef(null);

//   // Прокрутка наверх при изменении `pageInfo`
//   useEffect(() => {
//     if (listContainerRef.current) {
//       listContainerRef.current.scrollTo({
//         top: 0,
//         behavior: "instant",
//       });
//     }
//   }, [pageInfo]);

//   return (
//     <InfoTable>
//       <div className={classes.InfoTable_title}>
//         <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>ID</div>
//         <div className={`${classes.InfoTable_title_elem} ${classes.w25}`}>Название</div>
//         <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Город</div>
//         <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Оценка</div>
//         <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Звёздность</div>
//         <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>Адрес</div>
//         <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>Удалённость</div>
//         <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>Квота</div>
//         <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>Резерв</div>
//         {/* <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>Квота</div> */}
//       </div>

//       <div className={classes.bottom} ref={listContainerRef}>
//         {requests.map((item, index) => (
//           <Link
//             to={`/hotels/${item.id}`}
//             className={classes.InfoTable_data}
//             onClick={() => handleObject(item, index)}
//             key={index}
//           >
//             <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>
//               {item.order}
//             </div>
//             <div className={`${classes.InfoTable_data_elem} ${classes.w25}`}>
//               <div className={classes.InfoTable_data_elem_userInfo}>
//                 <div className={classes.InfoTable_data_elem_avatar}>
//                   <img
//                     loading="lazy"
//                     src={
//                       item.images.length != 0
//                         ? `${server}${item.images}`
//                         : "/no-avatar.png"
//                     }
//                     alt=""
//                   />
//                 </div>
//                 <div className={classes.InfoTable_data_elem_title}>
//                   {item.name}
//                 </div>
//               </div>
//             </div>
//             <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
//               <div className={classes.InfoTable_data_elem_title}>
//                 {item.information?.city}
//               </div>
//             </div>
//             <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>
//               <div className={classes.InfoTable_data_elem_title} style={{padding:'0 5px'}}>
//                 {Array.from({ length: 5 }, (_, index) => (
//                   <img
//                     key={index}
//                     src={index < item.stars ? "/star.png" : "/op_star.png"}
//                     className={classes.star}
//                   />
//                 ))}
//                 <p>{item.stars ? `${item.stars}/5` : ""}</p>
//               </div>
//             </div>
//             <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>
//               <div className={classes.InfoTable_data_elem_title} style={{padding:'0 5px'}}>
//                 {Array.from({ length: 5 }, (_, index) => (
//                   <img
//                     key={index}
//                     src={index < item.usStars ? "/star.png" : "/op_star.png"}
//                     className={classes.star}
//                   />
//                 ))}
//                 <p>{item.usStars ? `${item.usStars}/5` : ""}</p>
//               </div>
//             </div>
//             <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
//               <div className={classes.InfoTable_data_elem_title}>
//                 {item.information?.address}
//               </div>
//             </div>
//             <div className={`${classes.InfoTable_data_elem} ${classes.w10}`}>
//               <div className={classes.InfoTable_data_elem_title}>
//                 {item?.airportDistance ? `${item.airportDistance} мин` : ''}
//               </div>
//             </div>
//             <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>
//               <div className={classes.InfoTable_data_elem_title}>
//                 {item.quote ? item.quote : "0"}
//               </div>
//             </div>
//             <div className={`${classes.InfoTable_data_elem} ${classes.w5}`}>
//               <div className={classes.InfoTable_data_elem_title}>
//                 {item.provision ? item.provision : "0"}
//               </div>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </InfoTable>
//   );
// }

// export default InfoTableDataHotels;
