export const hasOverlap = ({ requests, updatedRequest }) => {
  const updatedRoomId =
    updatedRequest.room && typeof updatedRequest.room === "object"
      ? updatedRequest.room.id
      : updatedRequest.room;

  const roomRequests = requests.filter((req) => {
    const reqRoomId =
      req.room && typeof req.room === "object" ? req.room.id : req.room;
    return reqRoomId === updatedRoomId;
  });

  const updatedCheckIn = new Date(
    `${updatedRequest.checkInDate}T${updatedRequest.checkInTime}`
  );
  const updatedCheckOut = new Date(
    `${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}`
  );

  return roomRequests.some((otherRequest) => {
    if (otherRequest.id === updatedRequest.id) return false;
    if (otherRequest.position !== updatedRequest.position) return false;

    const otherCheckIn = new Date(
      `${otherRequest.checkInDate}T${otherRequest.checkInTime}`
    );
    const otherCheckOut = new Date(
      `${otherRequest.checkOutDate}T${otherRequest.checkOutTime}`
    );

    return !(
      updatedCheckOut <= otherCheckIn || updatedCheckIn >= otherCheckOut
    );
  });
};

export const getOverlappingRequests = ({
  requests,
  targetRoomId,
  draggedRequest,
}) => {
  return requests.filter((req) => {
    const reqCheckIn = new Date(
      `${req.checkInDate}T${req.checkInTime}:00`
    );
    const reqCheckOut = new Date(
      `${req.checkOutDate}T${req.checkOutTime}:00`
    );
    const draggedCheckIn = new Date(
      `${draggedRequest.checkInDate}T${draggedRequest.checkInTime}:00`
    );
    const draggedCheckOut = new Date(
      `${draggedRequest.checkOutDate}T${draggedRequest.checkOutTime}:00`
    );

    return (
      req.room?.id === targetRoomId &&
      !(
        reqCheckOut <= draggedCheckIn || reqCheckIn >= draggedCheckOut
      )
    );
  });
};
