import { gql } from "@apollo/client";

export const server = 'http://192.168.0.112:4000';

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  const token = parts.pop().split(';').shift()
  return token
};

export const decodeJWT = (token) => {
  const tokenParts = token.split('.');

  if (tokenParts.length !== 3) {
    throw new Error('Invalid JWT token');
  }

  const payloadBase64 = tokenParts[1];
  const payloadDecoded = atob(payloadBase64);

  const payloadObject = JSON.parse(payloadDecoded);

  return payloadObject;
}

// ----------------------------------------------------------------

// Запросы получения пользователя

export const SINGIN = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      token
    }
  }
`;

// Запросы получения пользователя

// ----------------------------------------------------------------

// Запросы к заявкам на эстафету

export const GET_REQUESTS = gql`
    query Request {
        requests {
          id
          airportId
          airport {
            id
            name
            city
            code
          }
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
          status
          person {
            id
            name
            number
            position
            gender
          }
          airline {
            name
            images
          }
          requestNumber
        }
    }
`;

export const REQUEST_CREATED_SUBSCRIPTION = gql`
    subscription RequestCreated {
        requestCreated {
          id
          airportId
          airport {
            id
            name
            city
            code
          }
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
          status
          person {
            id
            name
            number
            position
            gender
          }
          airline {
            name
            images
          }
          requestNumber
        }
    }
`;

export const CREATE_REQUEST_MUTATION = gql`
    mutation CreateRequest($input: CreateRequestInput!) {
        createRequest(input: $input) {
          id
          airportId
          airport {
            id
            name
            city
            code
          }
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
          status
          person {
            id
            name
            number
            position
            gender
          }
          airline {
            name
            images
          }
        }
    }
`;

export const GET_AIRLINES_RELAY = gql`
  query Airlines {
    airlines {
      id
      name
      staff {
        id
        name
        position
        gender
        number
      }
    }
  }
`;

export const GET_AIRPORTS_RELAY = gql`
  query Airports {
    airports {
      id
      name
      city
      code
    }
  }
`;

export const GET_HOTELS_RELAY = gql`
  query Hotels {
    hotels {
      id
      name
      city
    }
  }
`;

export const GET_REQUEST = gql`
    query Query($requestId: ID) {
      request(id: $requestId) {
          id
          airportId
          airport {
            id
            name
            city
            code
          }
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
          status
          person {
            id
            name
            number
            position
            gender
          }
          airline {
            name
            images
          }
          requestNumber
          hotel {
            id
            name
          }
          hotelChess {
            room
            place
          }
      }
    }
`;

export const UPDATE_HOTEL_BRON = gql`
  mutation Mutation($updateHotelId: ID!, $input: UpdateHotelInput!) {
    updateHotel(id: $updateHotelId, input: $input) {
      id
      hotelChesses {
        id
        hotelId
        public
        start
        startTime
        end
        endTime
        clientId
        requestId
        place
        room
      }
    }
  }
`;

export const GET_BRONS_HOTEL = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      name
      hotelChesses {
        public
        start
        startTime
        end
        endTime
        place
        room
        client {
          name
          number
          position
          gender
        }
        request {
          airport {
            city
            code
            name
          }
          arrival {
            date
            flight
            time
          }
          departure {
            flight
            date
            time
          }
          mealPlan {
            included
            breakfast
            lunch
            dinner
          }
          airline {
            name
            images
          }
          status
          requestNumber
        }
      }
    }
  }
`;

// Запросы к заявкам на эстафету

// ----------------------------------------------------------------

// Запросы в гостиницу

export const CREATE_HOTEL = gql`
  mutation Mutation($input: CreateHotelInput!, $images: [Upload!]) {
    createHotel(input: $input, images: $images) {
      images
      name
      city
      address
      quote
    }
  }
`;

export const GET_HOTELS = gql`
  query Hotel {
      hotels {
          id
          name
          city
          address
          quote
          images
      }
  }
`;

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

// Запросы в гостиницу

// ----------------------------------------------------------------

// Запросы в авиакомпанию

export const GET_AIRLINES = gql`
  query Airlines {
    airlines {
      id
      images
      name
    }
  }
`;

export const CREATE_AIRLINE = gql`
  mutation Mutation($input: CreateAirlineInput!, $images: [Upload!]) {
    createAirline(input: $input, images: $images) {
      id
      images
      name
    }
  }
`;

export const GET_AIRLINE = gql`
  query Airline($airlineId: ID!) {
    airline(id: $airlineId) {
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

export const UPDATE_AIRLINE = gql`
  mutation Mutation($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      name
      id
    }
  }
`;

export const GET_AIRLINE_COMPANY = gql`
  query Query($airlineId: ID!) {
    airline(id: $airlineId) {
      id
      name
      department {
        id
        name
        users {
          id
          name
          role
          images
          email
          login
        }
      }
    }
  }
`;

export const CREATE_AIRLINE_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!, $images: [Upload!]) {
    registerUser(input: $input, images: $images) {
      id
      images
      name
      role
      login
      password
      email
    }
  }
`;

export const CREATE_AIRLINE_DEPARTMERT = gql`
  mutation UpdateAirline($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      id
      name
      department {
        id
        name
        users {
          id
          name
          role
          images
          email
          login
          password
        }
      }
    }
  }
`;

export const CREATE_AIRLINE_STAFF = gql`
  mutation Mutation($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      staff {
        id
        name
        number
        position
        gender
      }
    }
  }
`;

export const UPDATE_AIRLINE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!, $images: [Upload!]) {
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

export const DELETE_AIRLINE_DEPARTMENT = gql`
  mutation Mutation($deleteAirlineDepartmentId: ID!) {
    deleteAirlineDepartment(id: $deleteAirlineDepartmentId) {
      id
    }
  }
`;

export const DELETE_AIRLINE_MANAGER = gql`
  mutation Mutation($deleteUserId: ID!) {
    deleteUser(id: $deleteUserId) {
      id
    }
  }
`;

export const GET_AIRLINE_USERS = gql`
  query AirlineUsers($airlineId: ID!) {
    airline(id: $airlineId) {
      staff {
        id
        name
        gender
        number
        position
      }
    }
  }
`;

export const UPDATE_AIRLINE_STAFF = gql`
  mutation Mutation($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      staff {
        id
        name
        number
        position
        gender
      }
    }
  }
`;

export const DELETE_AIRLINE_STAFF = gql`
  mutation DeleteAirlineStaff($deleteAirlineStaffId: ID!) {
    deleteAirlineStaff(id: $deleteAirlineStaffId) {
      id
      name
    }
  }
`;

// Запросы в авиакомпанию

// Запросы в компанию

export const GET_DISPATCHERS = gql`
  query Query {
    dispatcherUsers {
      id
      name
      images
      role
      email
      login
    }
  }
`;

export const GET_DISPATCHER = gql`
  query Query($userId: ID!) {
    user(userId: $userId) {
      name
      role
      images
      login
      email
      hotelId
      airlineId
      dispatcher
      airlineDepartmentId
    }
  }
`;

export const CREATE_DISPATCHER_USER = gql`
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

export const UPDATE_DISPATCHER_USER = gql`
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

export const DELETE_DISPATCHER_USER = gql`
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

// Запросы в компанию
