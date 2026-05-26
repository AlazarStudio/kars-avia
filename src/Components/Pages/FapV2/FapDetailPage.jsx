import React from "react";
import { useOutletContext } from "react-router-dom";
import FapDetail from "../../Blocks/FapV2/FapDetail/FapDetail";
import { canAccessMenu } from "../../../utils/access";

export default function FapDetailPage({ user }) {
  const { accessMenu } = useOutletContext();

  return (
    <FapDetail
      user={user}
      canEdit={canAccessMenu(accessMenu, "reserveUpdate", user)}
    />
  );
}
