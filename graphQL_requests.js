import { gql } from "@apollo/client";

// Начало - зарпосы на гостиницы

export const GET_HOTEL = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      id
      name
      country
      city
      address
      index
      email
      number
      inn
      ogrn
      rs
      bank
      bik
      images
    }
  }
`;

export const GET_HOTEL_ROOMS = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      categories {
        id
        name
        rooms {
          id
          name
        }
      }
    }
  }
`;

export const GET_HOTEL_NAME = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      name
    }
  }
`;

export const UPDATE_HOTEL = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!) {
    updateHotel(id: $updateHotelId, input: $input) {
      id
      name
    }
  }
`;

// Конец - зарпосы на гостиницы