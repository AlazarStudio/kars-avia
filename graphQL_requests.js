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

export const GET_HOTEL_TARIFS = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      tariffs {
        id
        name
        category {
          id
          name
          prices {
            id
            amount
            amountair
          }
        }
      }
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
        tariffs {
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
      categories {
        id
        name
        rooms {
          id
          name
        }
        tariffs {
          name
        }
      }
    }
  }
`;

export const UPDATE_HOTEL_TARIF = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!) {
    updateHotel(id: $updateHotelId, input: $input) {
      tariffs {
        id
        name
        category {
          id
          name
          prices {
            id
            amount
            amountair
          }
        }
      }
    }
  }
`;

export const DELETE_HOTEL_CATEGORY = gql`
  mutation DeleteCategory($deleteCategoryId: ID!) {
    deleteCategory(id: $deleteCategoryId) {
      name
    }
  }
`;

export const DELETE_HOTEL_TARIFF = gql`
  mutation Mutation($deleteTariffId: ID!) {
    deleteTariff(id: $deleteTariffId) {
      name
    }
  }
`;

export const DELETE_HOTEL_ROOM = gql`
  mutation Mutation($deleteRoomId: ID!) {
    deleteRoom(id: $deleteRoomId) {
      name
    }
  }
`;

// Конец - зарпосы на гостиницы