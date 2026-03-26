import { lazy, Suspense } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

const HotelAboutTab = lazy(() =>
  import("../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent")
);
const HotelCompanyTab = lazy(() =>
  import("../../../Blocks/HotelCompany_tabComponent/HotelCompany_tabComponent")
);
const HotelNomerFondTab = lazy(() =>
  import(
    "../../../Blocks/HotelNomerFond_tabComponent/HotelNomerFond_tabComponent"
  )
);
const HotelShahmatkaTab = lazy(() =>
  import(
    "../../../Blocks/HotelShahmatka_tabComponent/HotelShahmatka_tabComponent"
  )
);
const HotelTarifsTab = lazy(() =>
  import("../../../Blocks/HotelTarifs_tabComponent/HotelTarifs_tabComponent")
);
const HotelRegisterOfContracts = lazy(() =>
  import("../../../Blocks/HotelRegisterOfContracts/HotelRegisterOfContracts")
);
const HotelSettingsTab = lazy(() =>
  import(
    "../../../Blocks/HotelSettings_tabComponent/HotelSettings_tabComponent"
  )
);

import classes from "./DisAdminHotelContent.module.css";
import MUILoader from "../../../Blocks/MUILoader/MUILoader";

const DisAdminHotelContent = ({
  id,
  user,
  selectedTab,
  handleTabSelect,
  type,
  accessMenu,
}) => {
  return (
    <>
      <Tabs
        className={classes.tabs}
        selectedIndex={selectedTab}
        onSelect={handleTabSelect}
        forceRenderTabPanel={false}
      >
        <TabList className={classes.tabList}>
          <Tab className={classes.tab}>Шахматка</Tab>
          {type === "apartment" ? null : (
            <Tab className={classes.tab}>Тарифы</Tab>
          )}

          <Tab className={classes.tab}>Реестр договоров</Tab>
          <Tab className={classes.tab}>Номерной фонд</Tab>
          <Tab className={classes.tab}>Пользователи</Tab>
          <Tab className={classes.tab}>О гостинице</Tab>
          <Tab className={classes.tab}>Редактирование</Tab>
          {/* <Tab className={classes.tab}>Настройки</Tab> */}
        </TabList>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelShahmatkaTab id={id} user={user} accessMenu={accessMenu} />
          </Suspense>
        </TabPanel>

        {type === "apartment" ? null : (
          <TabPanel className={classes.tabPanel} forceRender={false}>
            <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
              <HotelTarifsTab id={id} user={user} />
            </Suspense>
          </TabPanel>
        )}

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelRegisterOfContracts id={id} user={user} accessMenu={accessMenu} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelNomerFondTab id={id} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelCompanyTab id={id} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelAboutTab id={id} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelSettingsTab id={id} />
          </Suspense>
        </TabPanel>
      </Tabs>
    </>
  );
};

export default DisAdminHotelContent;

// import { useState } from "react";
// import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

// import HotelAbout_tabComponent from "../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent";
// import HotelCompany_tabComponent from "../../../Blocks/HotelCompany_tabComponent/HotelCompany_tabComponent";
// import HotelNomerFond_tabComponent from "../../../Blocks/HotelNomerFond_tabComponent/HotelNomerFond_tabComponent";
// import HotelShahmatka_tabComponent from "../../../Blocks/HotelShahmatka_tabComponent/HotelShahmatka_tabComponent";
// import HotelTarifs_tabComponent from "../../../Blocks/HotelTarifs_tabComponent/HotelTarifs_tabComponent";

// import classes from "./DisAdminHotelContent.module.css";
// import Button from "../../../Standart/Button/Button";
// import CreateRequest from "../../../Blocks/CreateRequest/CreateRequest";
// import ExistRequest from "../../../Blocks/ExistRequest/ExistRequest";
// import DeleteComponent from "../../../Blocks/DeleteComponent/DeleteComponent";
// import { useMutation } from "@apollo/client";
// import { CANCEL_REQUEST, getCookie } from "../../../../../graphQL_requests";
// import HotelSettings_tabComponent from "../../../Blocks/HotelSettings_tabComponent/HotelSettings_tabComponent";

// const DisAdminHotelContent = ({
//   id,
//   user,
//   selectedTab,
//   handleTabSelect,
//   type,
// }) => {
//   const token = getCookie("token");
//   const [showCreateRequest, setShowCreateRequest] = useState(false);
//   const [showRequestSidebar, setShowRequestSidebar] = useState(false);
//   const [existRequestData, setExistRequestData] = useState(null); // Для хранения данных match
//   const [showDelete, setShowDelete] = useState(false);

//   // console.log(type);

//   const toggleCreateRequest = () => {
//     setShowCreateRequest((prev) => !prev);
//   };
//   const toggleRequestSidebar = () => setShowRequestSidebar(!showRequestSidebar);

//   const openDeleteComponent = () => {
//     setShowDelete(true);
//   };

//   const closeDeleteComponent = () => {
//     setShowDelete(false);
//   };

//   const handleOpenExistRequest = (matchData) => {
//     setExistRequestData(matchData); // Сохраняем данные match
//     setShowRequestSidebar(true); // Открываем ExistRequest
//   };

//   // Запрос на отмену созданной, но не размещенной заявки
//   const [cancelRequestMutation] = useMutation(CANCEL_REQUEST, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const handleCancelRequest = async (id) => {
//     try {
//       // Отправка запроса с правильным ID заявки
//       const response = await cancelRequestMutation({
//         variables: {
//           cancelRequestId: id,
//         },
//       });
//       // console.log("Заявка успешно отменена", response);
//     } catch (error) {
//       console.error("Ошибка при отмене заявки:", JSON.stringify(error));
//     }
//   };

//   return (
//     <>
//       <Tabs
//         className={classes.tabs}
//         selectedIndex={selectedTab}
//         onSelect={handleTabSelect}
//         forceRenderTabPanel={false}
//       >
//         <TabList className={classes.tabList}>
//           <div style={{ display: "flex" }}>
//             <Tab className={classes.tab}>Шахматка</Tab>
//             {type === "apartment" ? null : (
//               <Tab className={classes.tab}>Тарифы</Tab>
//             )}

//             <Tab className={classes.tab}>Номерной фонд</Tab>
//             <Tab className={classes.tab}>Пользователи</Tab>
//             <Tab className={classes.tab}>О гостинице</Tab>
//             <Tab className={classes.tab}>Настройки</Tab>
//           </div>
//           {selectedTab === 0 ? (
//             <Button onClick={toggleCreateRequest} minwidth={"200px"}>
//               Создать заявку
//             </Button>
//           ) : null}
//         </TabList>

//         <TabPanel className={classes.tabPanel}>
//           <HotelShahmatka_tabComponent id={id} />
//         </TabPanel>

//         {type === "apartment" ? null : (
//           <TabPanel className={classes.tabPanel}>
//             <HotelTarifs_tabComponent id={id} user={user} />
//           </TabPanel>
//         )}

//         <TabPanel className={classes.tabPanel}>
//           <HotelNomerFond_tabComponent id={id} />
//         </TabPanel>

//         <TabPanel className={classes.tabPanel}>
//           <HotelCompany_tabComponent id={id} />
//         </TabPanel>

//         <TabPanel className={classes.tabPanel}>
//           <HotelAbout_tabComponent id={id} />
//         </TabPanel>

//         <TabPanel className={classes.tabPanel}>
//           <HotelSettings_tabComponent id={id} />
//         </TabPanel>
//       </Tabs>
//       <CreateRequest
//         show={showCreateRequest}
//         onClose={toggleCreateRequest}
//         user={user}
//         // Если нужны дополнительные пропы, добавьте их:
//         onMatchFound={handleOpenExistRequest}
//         // addNotification={...}
//       />
//       <ExistRequest
//         // setChooseCityRequest={setChooseCityRequest}
//         show={showRequestSidebar}
//         onClose={toggleRequestSidebar}
//         // setChooseRequestID={setChooseRequestID}
//         // setShowChooseHotel={setShowChooseHotel}
//         chooseRequestID={existRequestData}
//         handleCancelRequest={handleCancelRequest}
//         user={user}
//         openDeleteComponent={openDeleteComponent}
//         // setRequestId={setChooseRequestId}
//       />
//       {showDelete && (
//         <DeleteComponent
//           remove={() => {
//             handleCancelRequest(existRequestData);
//             closeDeleteComponent();
//             setShowRequestSidebar(false);
//             setExistRequestData(null);
//           }}
//           index={existRequestData}
//           close={closeDeleteComponent}
//           title={`Вы действительно хотите отменить заявку? `}
//           isCancel={true}
//         />
//       )}
//     </>
//   );
// };

// export default DisAdminHotelContent;
