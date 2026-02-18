import { generateTimestampId } from "../../../../graphQL_requests";

export const translateStatus = (status) => {
  switch (status) {
    case "done":
      return "Забронирован";
    case "extended":
      return "Продлен";
    case "reduced":
      return "Сокращен";
    case "transferred":
      return "Перенесен";
    case "earlyStart":
      return "Ранний заезд";
    case "archived":
      return "Архив";
    case "archiving":
      return "Готов к архиву";
    default:
      return "Неизвестно";
  }
};

export const mapRooms = (rooms = []) =>
  rooms
    .map((room) => ({
      roomId: room.id,
      reserve: room.reserve,
      id: room.name,
      type: room.places,
      roomType: room.type,
      category: room.category,
      beds: room.beds,
      active: room.active,
      roomKind: room.roomKind,
      description: room.description,
      descriptionSecond: room.descriptionSecond,
    }))
    .sort((a, b) => {
      if (a.reserve !== b.reserve) {
        return a.reserve - b.reserve;
      }
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

export const mapHotelChessToRequest = (chess) => ({
  id: generateTimestampId(),
  room: {
    id: chess.room?.id,
    name: chess.room?.name,
    category: chess.room?.category,
    places: chess.room?.places,
    active: chess.room?.active,
    reserve: chess.room?.reserve,
  },
  position: chess.place - 1,
  checkInDate: new Date(chess.start).toISOString().split("T")[0],
  checkInTime: new Date(chess.start).toISOString().split("T")[1].slice(0, 5),
  checkOutDate: new Date(chess.end).toISOString().split("T")[0],
  checkOutTime: new Date(chess.end).toISOString().split("T")[1].slice(0, 5),
  status: translateStatus(chess.request ? chess.request?.status : chess.status),
  guest: chess.client ? chess.client.name : chess.passenger?.name,
  guestPosition: chess.client?.position?.name,
  requestID: chess.request ? chess.request?.id : chess.reserve?.id,
  isRequest: Boolean(chess.request),
  airline: chess.request ? chess.request?.airline : chess.reserve?.airline,
  personID: chess.client ? chess.client?.id : chess.passenger?.id,
  chessID: chess.id,
  requestNumber: chess.request
    ? chess.request?.requestNumber
    : chess.reserve?.reserveNumber,
});

export const mapRequestToPlacement = (request) => ({
  id: generateTimestampId(),
  checkInDate: new Date(request.arrival).toISOString().split("T")[0],
  checkInTime: new Date(request.arrival).toISOString().split("T")[1].slice(0, 5),
  checkOutDate: new Date(request.departure).toISOString().split("T")[0],
  checkOutTime: new Date(request.departure).toISOString().split("T")[1].slice(0, 5),
  status: "Ожидает",
  guest: request.person ? request.person.name : "Неизвестный гость",
  guestPosition: request.person ? request.person.position?.name : "",
  requestID: request.id,
  requestNumber: request.requestNumber,
  isRequest: true,
  airline: request.airline,
  personID: request?.person?.id,
  hotelId: request?.hotelId,
});

export const mapUpdatedRequestFromSubscription = (updated) => ({
  id: updated.id,
  checkInDate: new Date(updated.arrival).toISOString().split("T")[0],
  checkInTime: new Date(updated.arrival).toISOString().split("T")[1].slice(0, 5),
  checkOutDate: new Date(updated.departure).toISOString().split("T")[0],
  checkOutTime: new Date(updated.departure).toISOString().split("T")[1].slice(0, 5),
  status: translateStatus(updated.status),
  guest: updated.person?.name || "Неизвестный гость",
  requestID: updated.id,
  airline: updated.airline,
  personID: updated.person?.id,
  room: updated.room || null,
  isRequest: true,
});
