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

const SIDEBAR_TAKE = 500;

const sameId = (a, b) => String(a) === String(b);

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

  const authContext = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const { loading: loadingHotel, data: dataHotel } = useQuery(GET_HOTEL_MIN, {
    context: authContext,
    variables: { hotelId },
    fetchPolicy: "cache-and-network",
    skip: !hotelId,
  });

  useEffect(() => {
    if (dataHotel?.hotel) {
      setHotelInfo(dataHotel.hotel);
    }
  }, [dataHotel]);

  const airportId = hotelInfo?.airport?.id;

  const {
    loading: loadingRooms,
    data: dataRooms,
    refetch: roomsRefetch,
  } = useQuery(GET_HOTEL_ROOMS, {
    context: authContext,
    variables: { hotelId },
    fetchPolicy: "cache-and-network",
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
    context: authContext,
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

  const {
    loading: loadingRequests,
    data: dataBrons,
    refetch: refetchBrons,
  } = useQuery(GET_REQUESTS, {
    context: authContext,
    variables: {
      pagination: {
        skip: 0,
        take: SIDEBAR_TAKE,
        status: ["created", "opened"],
        airportId,
      },
    },
    skip: !airportId,
  });

  const { data: subscriptionData } = useSubscription(
    REQUEST_CREATED_SUBSCRIPTION,
    {
      context: authContext,
      onData: ({ data }) => {
        const created = data?.data?.requestCreated;
        if (created?.airport?.id && airportId && created.airport.id !== airportId) {
          return;
        }
        if (created?.hotelId && hotelId && created.hotelId !== hotelId) {
          // still may need sidebar for same airport; refresh lists scoped below
        }
        bronRefetch();
        if (airportId) refetchBrons();
      },
    }
  );

  const { data: subscriptionUpdateData } = useSubscription(
    REQUEST_UPDATED_SUBSCRIPTION,
    {
      context: authContext,
      onData: ({ data }) => {
        const updated = data?.data?.requestUpdated;
        const updatedHotelId =
          updated?.hotelId || updated?.hotelChess?.[0]?.hotelId;
        if (updatedHotelId && hotelId && updatedHotelId !== hotelId) {
          return;
        }
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
          sameId(req.requestID, updatedRequest.requestID)
            ? { ...req, ...updatedRequest, id: req.id, chessID: req.chessID }
            : req
        )
      );
    }
  }, [subscriptionUpdateData]);

  useEffect(() => {
    if (subscriptionData?.requestCreated) {
      const created = subscriptionData.requestCreated;
      if (airportId && created.airport?.id && created.airport.id !== airportId) {
        return;
      }
      setNewRequests((prev) => [...prev, mapRequestToPlacement(created)]);
    }
  }, [subscriptionData, airportId]);

  useEffect(() => {
    if (dataBrons?.requests?.requests) {
      setNewRequests(dataBrons.requests.requests.map(mapRequestToPlacement));
    }
  }, [dataBrons]);

  const { data: subscriptionDataPerson } = useSubscription(
    GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT,
    {
      context: authContext,
      onData: () => {
        bronRefetch();
      },
    }
  );

  useSubscription(REQUEST_RESERVE_UPDATED_SUBSCRIPTION, {
    context: authContext,
    onData: () => {
      bronRefetch();
    },
  });

  const {
    loading: loadingReserves,
    data: dataReserves,
    refetch: refetchReserves,
  } = useQuery(GET_RESERVE_REQUESTS, {
    context: authContext,
    variables: {
      pagination: { skip: 0, take: SIDEBAR_TAKE, airportId },
    },
    skip: !airportId,
  });

  const {
    loading: loadingReserveOne,
    data: dataReserveOne,
    refetch: refetchReserveOne,
  } = useQuery(GET_RESERVE_REQUEST, {
    context: authContext,
    variables: { reserveId: openReserveId },
    skip: !openReserveId,
  });

  const {
    loading: loadingHotelReserveOne,
    data: dataHotelReserveOne,
    refetch: refetchHotelReserveOne,
  } = useQuery(GET_RESERVE_REQUEST_HOTELS, {
    context: authContext,
    variables: { reservationHotelsId: openReserveId },
    skip: !openReserveId,
  });

  useEffect(() => {
    if (dataReserves?.reserves?.reserves) {
      setRequestsReserves(dataReserves.reserves.reserves);
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
        const combinedPersons =
          isPerson && !isPassanger
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
  }, [
    subscriptionDataPerson,
    refetchHotelReserveOne,
    requestsHotelReserveOne,
    hotelInfo?.id,
  ]);

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
