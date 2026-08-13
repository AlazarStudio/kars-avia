import React from "react";
import { useOutletContext } from "react-router-dom";
import FapDetail from "../../Blocks/FapV2/FapDetail/FapDetail";
import { canAccessMenu } from "../../../utils/access";
import { canEditCompletedRequest } from "../../Blocks/FapV2/fapEditAccess";

export default function FapDetailPage({ user }) {
  const { accessMenu } = useOutletContext();

  // Заявка грузится внутри FapDetail, поэтому статус здесь неизвестен —
  // отдаём готовое право, а блокировку считает сам FapDetail.
  return (
    <FapDetail
      user={user}
      canEdit={canAccessMenu(accessMenu, "reserveUpdate", user)}
      canEditCompleted={canEditCompletedRequest(accessMenu, user)}
    />
  );
}
