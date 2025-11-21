import React from "react";
import classes from "./ReservePlacementRepresentative.module.css";
import Button from "../../Standart/Button/Button";
import { getCookie } from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import Message from "../../Blocks/Message/Message";

export default function ChatPanel({ request, user, setIsHaveTwoChats, isHaveTwoChats }) {
  const token = getCookie("token");
  return (
    <div className={classes.chatWrapper}>
      <Message
        activeTab={"Комментарий"}
        setIsHaveTwoChats={setIsHaveTwoChats}
        chooseReserveID={request?.id}
        token={token}
        user={user}
        chatPadding={"0"}
        chatHeight={"calc(100vh - 322px)"}
      />
    </div>
  );
}
