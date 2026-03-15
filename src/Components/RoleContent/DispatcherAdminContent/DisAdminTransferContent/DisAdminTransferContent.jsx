import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";

import classes from "./DisAdminTransferContent.module.css";
import MUILoader from "../../../Blocks/MUILoader/MUILoader";
import Header from "../../../Blocks/Header/Header";

const TransferOrders = lazy(() =>
  import("../../../Blocks/TransferOrders/TransferOrders")
);
const TransferOrder = lazy(() =>
  import("../../../Blocks/TransferOrder/TransferOrder")
);

const DisAdminTransferContent = ({ user, accessMenu }) => {
  const { orderId } = useParams();

  const isOrderDetails = !!orderId;

  if (isOrderDetails) {
    return (
      <Suspense fallback={<MUILoader fullHeight="100%" />}>
        <TransferOrder user={user} accessMenu={accessMenu} />
      </Suspense>
    );
  }

  return (
    <div className={classes.section}>
      <div className={classes.header}>
        <Header>
          <div className={classes.titleHeader}>Трансфер</div>
        </Header>
      </div>
      <div className={classes.content}>
        <Suspense fallback={<MUILoader fullHeight="100vh" />}>
          <TransferOrders user={user} disAdmin={true} accessMenu={accessMenu} />
        </Suspense>
      </div>
    </div>
  );
};

export default DisAdminTransferContent;
