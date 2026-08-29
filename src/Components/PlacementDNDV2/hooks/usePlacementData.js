import { useEffect, useMemo, useState } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_BRONS_HOTEL,
  GET_HOTEL_MIN,
  GET_HOTEL_ROOMS,
  GET_REQUESTS,
  REQUEST_CREATED_SUBSCRIPTION,
  REQUEST_UPDATED_SUBSCRIPTION,
} from "../../../../graphQL_requests";
import {
  mapHotelChessToRequest,
  mapRequestToPlacement,
  mapRooms,
  mapUpdatedRequestFromSubscription,
} from "../utils/placementTransforms";

const SIDEBAR_TAKE = 500;

// periodStart/periodEnd — ISO-строки границ показываемого периода (месяц/неделя).
export const usePlacementData = ({ hotelId, token, periodStart, periodEnd }) => {
  const [hotelInfo, setHotelInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [newRequests, setNewRequests] = useState([]);

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

  const {
    loading: bronLoading,
    data: bronData,
    refetch: bronRefetch,
  } = useQuery(GET_BRONS_HOTEL, {
    context: authContext,
    variables: {
      hotelId,
      hcPagination: {
        start: periodStart,
        end: periodEnd,
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
      onData: () => {
        // const created = data?.data?.requestCreated;
        // if (created?.airport?.id && airportId && created.airport.id !== airportId) {
        //   return;
        // }
        // if (created?.hotelId && hotelId && created.hotelId !== hotelId) {
        //   // still may need sidebar for same airport; refresh lists scoped below
        // }
        bronRefetch();
        if (airportId) refetchBrons();
      },
    }
  );

  const { data: subscriptionUpdateData } = useSubscription(
    REQUEST_UPDATED_SUBSCRIPTION,
    {
      context: authContext,
      onData: () => {
        // const updated = data?.data?.requestUpdated;
        // const updatedHotelId =
        //   updated?.hotelId || updated?.hotelChess?.[0]?.hotelId;
        // if (updatedHotelId && hotelId && updatedHotelId !== hotelId) {
        //   return;
        // }
        bronRefetch();
      },
    }
  );

  // useEffect(() => {
  //   if (subscriptionUpdateData?.requestUpdated) {
  //     const updatedRequest = mapUpdatedRequestFromSubscription(
  //       subscriptionUpdateData.requestUpdated
  //     );

  //     setRequests((prevRequests) =>
  //       prevRequests.map((req) =>
  //         sameId(req.requestID, updatedRequest.requestID)
  //           ? { ...req, ...updatedRequest, id: req.id, chessID: req.chessID }
  //           : req
  //       )
  //     );
  //   }
  // }, [subscriptionUpdateData]);

  // useEffect(() => {
  //   if (subscriptionData?.requestCreated) {
  //     const created = subscriptionData.requestCreated;
  //     if (airportId && created.airport?.id && created.airport.id !== airportId) {
  //       return;
  //     }
  //     setNewRequests((prev) => [...prev, mapRequestToPlacement(created)]);
  //   }
  // }, [subscriptionData, airportId]);

  useEffect(() => {
    if (dataBrons?.requests?.requests) {
      setNewRequests(dataBrons.requests.requests.map(mapRequestToPlacement));
    }
  }, [dataBrons]);

  return {
    hotelInfo,
    loadingHotel,
    loadingRooms,
    loadingRequests,
    rooms,
    roomsRefetch,
    requests,
    setRequests,
    newRequests,
    setNewRequests,
    bronLoading,
    bronRefetch,
    refetchBrons,
  };
};
