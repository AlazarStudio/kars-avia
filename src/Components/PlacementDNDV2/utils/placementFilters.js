import { isWithinInterval } from "date-fns";

export const filterRequestsBySearch = ({
  requests,
  searchQuery,
  startOfCurrentMonth,
  endOfCurrentMonth,
}) => {
  if (!searchQuery) return requests;

  const query = searchQuery.toLowerCase();

  return requests.filter((request) => {
    const matchesSearch =
      request?.guest?.toLowerCase().includes(query) ||
      (request?.guestPosition
        ? request.guestPosition.toLowerCase().includes(query)
        : null) ||
      (request?.room && request.room?.name?.toLowerCase().includes(query)) ||
      request.requestID.toLowerCase().includes(query) ||
      request.airline?.name.toLowerCase().includes(query);

    const inMonth =
      isWithinInterval(new Date(request.checkInDate), {
        start: startOfCurrentMonth,
        end: endOfCurrentMonth,
      }) ||
      isWithinInterval(new Date(request.checkOutDate), {
        start: startOfCurrentMonth,
        end: endOfCurrentMonth,
      }) ||
      (new Date(request.checkInDate) <= endOfCurrentMonth &&
        new Date(request.checkOutDate) >= startOfCurrentMonth);

    return matchesSearch && inMonth;
  });
};

export const buildFilteredRooms = ({ rooms, filteredRequests, searchQuery }) => {
  const query = searchQuery?.toLowerCase();

  const baseFiltered = !query
    ? rooms
    : rooms.filter(
        (room) =>
          filteredRequests.some((request) => request.room?.id === room.roomId) ||
          room.id.toLowerCase().includes(query)
      );

  const withRequests = baseFiltered.map((room) => ({
    ...room,
    requests: filteredRequests.filter((req) => req.room?.id === room.roomId),
  }));

  return withRequests.sort((a, b) => {
    if (a.reserve === b.reserve) {
      return a.type - b.type;
    }
    return a.reserve ? 1 : -1;
  });
};
