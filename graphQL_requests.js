import { gql } from "@apollo/client";

export const server = 'http://192.168.0.112:4000';
    
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

// Запросы получения пользователя

export const SINGIN = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      token
    }
  }
`;

// Запросы получения пользователя

// Запросы к заявкам на эстафету

export const GET_REQUESTS = gql`
    query Request {
        requests {
            id
            fullName
            position
            gender
            phoneNumber
            arrival {
            flight
            date
            time
            }
            departure {
            flight
            date
            time
            }
            roomCategory
            mealPlan {
            included
            breakfast
            lunch
            dinner
            }
            senderId
            receiverId
            createdAt
            updatedAt
            hotelId
            roomNumber
            airlineId
            status
            airportId
        }
    }
`;

export const REQUEST_CREATED_SUBSCRIPTION = gql`
    subscription RequestCreated {
        requestCreated {
            id
            fullName
            position
            gender
            phoneNumber
            arrival {
                flight
                date
                time
            }
            departure {
                flight
                date
                time
            }
            roomCategory
            mealPlan {
                included
                breakfast
                lunch
                dinner
            }
            senderId
            receiverId
            createdAt
            updatedAt
            hotelId
            roomNumber
            airlineId
            status
            airportId
        }
    }
`;

// Запросы к заявкам на эстафету

// Начало - зарпосы в гостиницу

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
          places
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
          places
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


export const GET_HOTEL_USERS = gql`
  query HotelUsers($hotelId: ID!) {
    hotelUsers(hotelId: $hotelId) {
      id
      name
      email
      role
      login
      images
    }
  }
`;

export const CREATE_HOTEL_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!, $images: [Upload!]) {
    registerUser(input: $input, images: $images) {
      id
      name
      email
      role
      login
      images
    }
  }
`;

export const UPDATE_HOTEL_USER = gql`
  mutation Mutation($input: UpdateUserInput!, $images: [Upload!]) {
    updateUser(input: $input, images: $images) {
      id
      name
      email
      role
      login
      images
    }
  }
`;

export const DELETE_HOTEL_USER = gql`
  mutation Mutation($deleteUserId: ID!) {
    deleteUser(id: $deleteUserId) {
      id
      name
      email
      role
      login
      images
    }
  }
`;

// Конец - зарпосы в гостиницу