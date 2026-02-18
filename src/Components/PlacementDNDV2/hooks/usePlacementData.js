import { useEffect, useMemo, useState } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import { endOfMonth, startOfMonth } from "date-fns";
import {
  GET_BRONS_HOTEL,
  GET_HOTEL_MIN,
  GET_HOTEL_ROOMS,
  GET_REQUESTS,
  GET_RESERVE_REQUEST,
  GET_RESERVE_REQUEST_HOTELS,
  GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT,
  GET_RESERVE_REQUESTS,
  REQUEST_CREATED_SUBSCRIPTION,
  REQUEST_RESERVE_UPDATED_SUBSCRIPTION,
  REQUEST_UPDATED_SUBSCRIPTION,
  generateTimestampId,
} from "../../../../graphQL_requests";
import {
  mapHotelChessToRequest,
  mapRequestToPlacement,
  mapRooms,
  mapUpdatedRequestFromSubscription,
} from "../utils/placementTransforms";

export const usePlacementData = ({
  hotelId,
  token,
  currentMonth,
  openReserveId,
  showModalForAddHotelInReserve,
}) => {
  const [hotelInfo, setHotelInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [newRequests, setNewRequests] = useState([]);

  const [requestsReserves, setRequestsReserves] = useState([]);
  const [requestsReserveOne, setRequestsReserveOne] = useState([]);
  const [requestsHotelReserveOne, setRequestsHotelReserveOne] = useState([]);
  const [newReservePassangers, setNewReservePassangers] = useState([]);

  const { loading: loadingHotel, data: dataHotel } = useQuery(GET_HOTEL_MIN, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId },
    fetchPolicy: "network-only",
    skip: !hotelId,
  });

  useEffect(() => {
    if (dataHotel?.hotel) {
      setHotelInfo(dataHotel.hotel);
    }
  }, [dataHotel]);

  const {
    loading: loadingRooms,
    data: dataRooms,
    refetch: roomsRefetch,
  } = useQuery(GET_HOTEL_ROOMS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId },
    fetchPolicy: "network-only",
    skip: !hotelId,
  });

  const rooms = useMemo(
    () => mapRooms(dataRooms?.hotel?.rooms || []),
    [dataRooms]
  );

  const firstDay = useMemo(
    () => startOfMonth(currentMonth).toISOString(),
    [currentMonth]
  );
  const lastDay = useMemo(
    () => endOfMonth(currentMonth).toISOString(),
    [currentMonth]
  );

  const {
    loading: bronLoading,
    data: bronData,
    refetch: bronRefetch,
  } = useQuery(GET_BRONS_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      hotelId,
      hcPagination: {
        start: firstDay,
        end: lastDay,
      },
    },
    fetchPolicy: "network-only",
    skip: !hotelId,
  });

  useEffect(() => {
    if (bronData?.hotel?.hotelChesses) {
      setRequests(bronData.hotel.hotelChesses.map(mapHotelChessToRequest));
    }
  }, [bronData]);

  const { data: subscriptionData } = useSubscription(
    REQUEST_CREATED_SUBSCRIPTION,
    {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    onData: () => {
      bronRefetch();
      refetchBrons();
    },
    }
  );

  const { data: subscriptionUpdateData } = useSubscription(
    REQUEST_UPDATED_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        bronRefetch();
      },
    }
  );

  useEffect(() => {
    if (subscriptionUpdateData?.requestUpdated) {
      const updatedRequest = mapUpdatedRequestFromSubscription(
        subscriptionUpdateData.requestUpdated
      );

      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === updatedRequest.id ? updatedRequest : req
        )
      );
    }
  }, [subscriptionUpdateData]);

  const {
    loading: loadingRequests,
    data: dataBrons,
    refetch: refetchBrons,
  } = useQuery(GET_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        skip: 0,
        take: 99999999,
        status: ["created", "opened"],
      },
    },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (subscriptionData?.requestCreated) {
      setNewRequests((prev) => [
        ...prev,
        mapRequestToPlacement(subscriptionData.requestCreated),
      ]);
    }
  }, [subscriptionData]);

  useEffect(() => {
    if (
      dataBrons?.requests?.requests &&
      hotelInfo?.information?.city
    ) {
      const filteredRequests = dataBrons.requests.requests.filter(
        (request) => request.airport.city === hotelInfo.information?.city
      );

      const transformedRequests = filteredRequests.map(mapRequestToPlacement);
      setNewRequests(transformedRequests);
    }
  }, [dataBrons, hotelInfo?.information?.city, refetchBrons]);

  const { data: subscriptionDataPerson } = useSubscription(
    GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        bronRefetch();
      },
    }
  );

  useSubscription(REQUEST_RESERVE_UPDATED_SUBSCRIPTION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    onData: () => {
      bronRefetch();
    },
  });

  const {
    loading: loadingReserves,
    data: dataReserves,
    refetch: refetchReserves,
  } = useQuery(GET_RESERVE_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { pagination: { skip: 0, take: 999999999 } },
  });

  const {
    loading: loadingReserveOne,
    data: dataReserveOne,
    refetch: refetchReserveOne,
  } = useQuery(GET_RESERVE_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { reserveId: openReserveId },
    skip: !openReserveId,
  });

  const {
    loading: loadingHotelReserveOne,
    data: dataHotelReserveOne,
    refetch: refetchHotelReserveOne,
  } = useQuery(GET_RESERVE_REQUEST_HOTELS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { reservationHotelsId: openReserveId },
    skip: !openReserveId,
  });

  useEffect(() => {
    if (dataReserves?.reserves?.reserves) {
      const sortedRequests = dataReserves.reserves.reserves.filter(
        (reserve) => reserve.airport?.city === hotelInfo?.information?.city
      );
      setRequestsReserves(sortedRequests);
    }

    if (openReserveId && dataReserveOne?.reserve) {
      setRequestsReserveOne(dataReserveOne.reserve);
    }

    if (openReserveId && dataHotelReserveOne?.reservationHotels) {
      setRequestsHotelReserveOne(dataHotelReserveOne.reservationHotels);
    }
  }, [
    dataReserves,
    dataReserveOne,
    dataHotelReserveOne,
    hotelInfo?.information?.city,
    openReserveId,
  ]);

  useEffect(() => {
    if (!showModalForAddHotelInReserve || !hotelInfo?.id) return;

    const reservePassangers = requestsHotelReserveOne.filter(
      (hotel) => hotel.hotel.id === hotelInfo.id
    );

    const bronedPersons = reservePassangers.flatMap(
      (item) =>
        item.reserve?.hotelChess
          ?.map((chess) => chess.passenger?.id || chess.client?.id)
          .filter(Boolean) || []
    );

    const transformedRequests = reservePassangers
      .flatMap((reservePassanger) => {
        const combinedPersons = [
          ...(reservePassanger?.person || []),
          ...(reservePassanger?.passengers || []),
        ];

        const filteredPersons = combinedPersons.filter(
          (person) => !bronedPersons.includes(person.id)
        );

        return filteredPersons
          .map((request) => {
            const arrivalDate = reservePassanger?.reserve?.arrival;
            const departureDate = reservePassanger?.reserve?.departure;

            if (!arrivalDate || !departureDate) {
              return null;
            }

            return {
              id: generateTimestampId(),
              checkInDate: new Date(arrivalDate).toISOString().split("T")[0],
              checkInTime: new Date(arrivalDate)
                .toISOString()
                .split("T")[1]
                .slice(0, 5),
              checkOutDate: new Date(departureDate).toISOString().split("T")[0],
              checkOutTime: new Date(departureDate)
                .toISOString()
                .split("T")[1]
                .slice(0, 5),
              status: "Ожидает",
              guest: request.name ? request.name : "Неизвестный гость",
              reserveId: reservePassanger?.reserve?.id,
              isRequest: false,
              airline: reservePassanger?.reserve?.airline,
              personID: request.id,
            };
          })
          .filter(Boolean);
      })
      .filter(Boolean);

    setNewReservePassangers(transformedRequests);
  }, [requestsHotelReserveOne, showModalForAddHotelInReserve, hotelInfo?.id]);

  useEffect(() => {
    if (!subscriptionDataPerson?.reservePersons || !hotelInfo?.id) return;

    const reservePassangers = requestsHotelReserveOne.filter(
      (hotel) => hotel.hotel.id === hotelInfo.id
    );

    const bronedPersons = reservePassangers.flatMap(
      (item) =>
        item.reserve?.hotelChess
          ?.map((chess) => chess.passenger?.id || chess.client?.id)
          .filter(Boolean) || []
    );

    const { reservePersons } = subscriptionDataPerson;

    const isPerson = reservePassangers[0]?.person?.length > 0;
    const isPassanger = reservePassangers[0]?.passengers?.length > 0;

    const transformedRequests = reservePassangers
      .flatMap((reservePassanger) => {
        const combinedPersons = isPerson && !isPassanger
          ? [...(reservePersons?.reserveHotel.person || [])]
          : !isPerson && isPassanger
          ? [...(reservePersons?.reserveHotel.passengers || [])]
          : [];

        const filteredPersons = combinedPersons.filter(
          (person) => !bronedPersons.includes(person.id)
        );

        return filteredPersons
          .map((request) => {
            const arrivalDate = reservePassanger?.reserve?.arrival;
            const departureDate = reservePassanger?.reserve?.departure;

            if (!arrivalDate || !departureDate) {
              return null;
            }

            return {
              id: generateTimestampId(),
              checkInDate: new Date(arrivalDate).toISOString().split("T")[0],
              checkInTime: new Date(arrivalDate)
                .toISOString()
                .split("T")[1]
                .slice(0, 5),
              checkOutDate: new Date(departureDate).toISOString().split("T")[0],
              checkOutTime: new Date(departureDate)
                .toISOString()
                .split("T")[1]
                .slice(0, 5),
              status: "Ожидает",
              guest: request.name ? request.name : "Неизвестный гость",
              reserveId: reservePassanger?.reserve?.id,
              isRequest: false,
              airline: reservePassanger?.reserve?.airline,
              personID: request.id,
            };
          })
          .filter(Boolean);
      })
      .filter(Boolean);

    setNewReservePassangers((prevReservePassangers) => {
      const existingIds = new Set(
        prevReservePassangers.map((item) => item.personID)
      );
      const newEntries = transformedRequests.filter(
        (item) => !existingIds.has(item.personID)
      );
      return [...prevReservePassangers, ...newEntries];
    });

    refetchHotelReserveOne();
  }, [subscriptionDataPerson, refetchHotelReserveOne, requestsHotelReserveOne, hotelInfo?.id]);

  return {
    hotelInfo,
    loadingHotel,
    loadingRooms,
    loadingRequests,
    loadingReserves,
    loadingReserveOne,
    loadingHotelReserveOne,
    rooms,
    roomsRefetch,
    requests,
    setRequests,
    newRequests,
    setNewRequests,
    bronLoading,
    bronRefetch,
    refetchBrons,
    refetchReserves,
    refetchReserveOne,
    refetchHotelReserveOne,
    requestsReserves,
    requestsReserveOne,
    requestsHotelReserveOne,
    newReservePassangers,
  };
};
