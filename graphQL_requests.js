import { gql } from "@apollo/client";

// export const path = '192.168.0.113:4000';
// export const path = '89.169.39.59:4000';

// export const path = 'backend.karsavia.ru:4000';
// export const server = `https://${path}`;

export const path = '192.168.0.24:4000';
export const server = `http://${path}`;

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

export function convertToDate(dateString, includeTime = false) {
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();

  let formattedDate = `${day}.${month}.${year}`;

  if (includeTime) {
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    formattedDate = ` ${hours}:${minutes}`;
  }

  return formattedDate;
}

export function generateTimestampId(min = 1, max = 1000000) {
  return Date.now() + Math.floor(Math.random() * (max - min + 1)) + min; // Возвращает количество миллисекунд с 1 января 1970 года
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

export const SINGUP = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      token
    }
  }
`;

// Запросы получения пользователя

// ----------------------------------------------------------------

// Запросы к заявкам на эстафету

export const GET_REQUESTS = gql`
  query Requests($pagination: PaginationInput) {
    requests(pagination: $pagination) {
      totalCount
      totalPages
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
        }
        departure {
          flight
          date
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
}

`;

export const GET_REQUESTS_ARCHIVED = gql`
  query RequestArchive($pagination: PaginationInput) {
    requestArchive(pagination: $pagination) {
      totalCount
        totalPages
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
          }
          departure {
            flight
            date
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
          }
          departure {
            flight
            date
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
          hotelChess {
            start
            end
            room
            id
            place
          }
        }
    }
`;

export const REQUEST_UPDATED_SUBSCRIPTION = gql`
    subscription requestUpdated {
        requestUpdated {
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
          }
          departure {
            flight
            date
          }
          roomCategory
          mealPlan {
            included
            breakfast
            lunch
            dinner
            dailyMeals {
              breakfast
              date
              dinner
              lunch
            }
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
          hotelChess {
            start
            end
            room
            id
            place
          }
        }
    }
`;

export const REQUEST_MESSAGES_SUBSCRIPTION = gql`
  subscription($chatId: ID!) {
    messageSent(chatId: $chatId) {
      id
      text
      sender {
        id
        name
        role
      }
      createdAt
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
          }
          departure {
            flight
            date
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
          }
          departure {
            flight
            date
          }
          roomCategory
          mealPlan {
            included
            breakfast
            lunch
            dinner
            dailyMeals {
              breakfast
              date
              dinner
              lunch
            }
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
        end
        clientId
        requestId
        place
        room
      }
    }
  }
`;

export const UPDATE_REQUEST_RELAY = gql`
  mutation Mutation($updateRequestId: ID!, $input: UpdateRequestInput!) {
    updateRequest(id: $updateRequestId, input: $input) {
      status
    }
  }
`;

export const GET_BRONS_HOTEL = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      name
      hotelChesses {
        id
        public
        start
        end
        place
        room
        client {
          id
          name
          number
          position
          gender
        }
        request {
          id
          airport {
            city
            code
            name
          }
          arrival {
            date
            flight
          }
          departure {
            flight
            date
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

export const GET_MESSAGES_HOTEL = gql`
  query Requests($requestId: ID!, $reserveId: ID) {
    chats(requestId: $requestId, reserveId: $reserveId) {
      id
      messages {
        text
        createdAt
        sender {
          id
          name
          role
        }
      }
    }
  }
`;

export const UPDATE_MESSAGE_BRON = gql`
  mutation ($chatId: ID, $senderId: ID!, $text: String!) {
    sendMessage(chatId: $chatId, senderId: $senderId, text: $text) {
      id
      text
      sender {
        id
        name
        role
      }
      createdAt
    }
  }
`;

export const GET_USER_BRONS = gql`
  query AirlineStaff($airlineStaffId: ID!) {
    airlineStaff(id: $airlineStaffId) {
      hotelChess {
        start
        end
        hotel {
          name
        }
      }
    }
  }
`;

export const GET_LOGS = gql`
  query Query($requestId: ID) {
    request(id: $requestId) {
      logs {
        id
        action
        description
        oldData
        newData
        createdAt
        user {
          name
          role
        }
      }
      person {
        name
        position
      }
      airport {
        name
      }
      id
      arrival {
        flight
      }
      hotel {
        name
      }
    }
  }
`;

export const SAVE_MEALS_MUTATION = gql`
  mutation ModifyDailyMeals($input: ModifyDailyMealsInput!) {
    modifyDailyMeals(input: $input) {
      included
      breakfast
      lunch
      dinner
      dailyMeals {
        date
        breakfast
        lunch
        dinner
      }
    }
  }
`;

export const SAVE_HANDLE_EXTEND_MUTATION = gql`
  mutation ExtendRequestDates($input: ExtendRequestDatesInput!) {
    extendRequestDates(input: $input) {
      arrival {
        flight
        date
      }
      departure {
        flight
        date
      }
      hotelChess {
        start
        end
        room
      }
      mealPlan {
        included
        breakfast
        lunch
        dinner
        dailyMeals {
          date
          breakfast
          lunch
          dinner
        }
      }
    }
  }
`;

export const CHANGE_TO_ARCHIVE = gql`
  mutation Mutation($archivingRequstId: ID!) {
    archivingRequst(id: $archivingRequstId) {
      id
    }
  }
`;


// Запросы к заявкам на эстафету

// ----------------------------------------------------------------

// Запросы к заявкам на резерв

export const CREATE_REQUEST_RESERVE_MUTATION = gql`
  mutation CreateReserve($input: CreateReserveInput!) {
    createReserve(input: $input) {
      id
      airport {
        id
        name
        city
        code
      }
      arrival {
        flight
        date
      }
      departure {
        flight
        date
      }
      mealPlan {
        included
        breakfast
        lunch
        dinner
      }
      senderId
      createdAt
      updatedAt
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

export const GET_RESERVE_REQUESTS = gql`
  query Query($pagination: PaginationInput) {
    reserves(pagination: $pagination) {
      totalCount
      totalPages
      reserves {
        id
        airport {
          id
          name
          city
          code
        }
        arrival {
          flight
          date
        }
        departure {
          flight
          date
        }
        mealPlan {
          included
          breakfast
          lunch
          dinner
        }
        senderId
        createdAt
        updatedAt
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
        reserveNumber
        passengerCount
      }
    }
  }
`;

export const REQUEST_RESERVE_CREATED_SUBSCRIPTION = gql`
  subscription ReserveCreated {
    reserveCreated {
      id
      createdAt
      updatedAt
      airport {
        id
        name
        city
        code
      }
      airline {
        id
        name
        images
      }
      senderId
      arrival {
        flight
        date
      }
      departure {
        flight
        date
      }
      mealPlan {
        included
        breakfast
        lunch
        dinner
      }
      status
      reserveNumber
      passengerCount
    }
  }
`;

export const REQUEST_RESERVE_UPDATED_SUBSCRIPTION = gql`
  subscription ReserveUpdated {
    reserveUpdated {
      id
      createdAt
      updatedAt
      airport {
        id
        name
        city
        code
      }
      airline {
        id
        name
        images
      }
      senderId
      arrival {
        flight
        date
      }
      departure {
        flight
        date
      }
      mealPlan {
        included
        breakfast
        lunch
        dinner
      }
      status
      reserveNumber
      passengerCount
    }
  }
`;

export const GET_RESERVE_REQUEST = gql`
  query Reserve($reserveId: ID!) {
    reserve(id: $reserveId) {
      id
      airport {
        id
        name
        city
        code
      }
      arrival {
        flight
        date
      }
      departure {
        flight
        date
      }
      mealPlan {
        included
        breakfast
        lunch
        dinner
      }
      senderId
      createdAt
      updatedAt
      status
      person {
        id
        name
        number
        position
        gender
      }
      airline {
        id
        name
        images
      }
      reserveNumber
      passengerCount
      reserveForPerson
    }
  }
`;

export const ADD_HOTEL_TO_RESERVE = gql`
  mutation AddHotelToReserve($reservationId: ID!, $hotelId: ID!, $capacity: Int!) {
    addHotelToReserve(reservationId: $reservationId, hotelId: $hotelId, capacity: $capacity) {
      id
    }
  }
`;

export const GET_RESERVE_REQUEST_HOTELS = gql`
  query ReservationHotels($reservationHotelsId: ID!) {
    reservationHotels(id: $reservationHotelsId) {
      id
      hotel {
        id
        name
        city
      }
      passengers {
        id
        name
        number
        gender
      }
      capacity
      person {
        id
        name
        number
        gender
      }
      reserve {
        id
      }
    }
  }
`;

export const GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION = gql`
  subscription ReserveHotel {
    reserveHotel {
      id
      hotel {
        id
        name
        city
      }
      passengers {
        id
        name
        number
        gender
      }
      capacity
      person {
        id
        name
        number
        gender
      }
      reserve {
        id
      }
    }
  }
`;

export const GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS = gql`
  subscription ReservePersons {
    reservePersons {
      reserveHotel {
        id
      }
      passengers {
        id
        name
        number
        gender
      }
      person {
        id
        name
        number
        gender
      }
    }
  }
`;

export const ADD_PERSON_TO_HOTEL = gql`
  mutation AssignPersonToHotel($input: assignPersonInput!) {
    assignPersonToHotel(input: $input) {
      id
    }
  }
`;

export const ADD_PASSENGER_TO_HOTEL = gql`
  mutation Mutation($reservationId: ID!, $input: PassengerInput!, $hotelId: ID!) {
    addPassengerToReserve(reservationId: $reservationId, input: $input, hotelId: $hotelId) {
      id
    }
  }
`;

export const DELETE_PERSON_FROM_HOTEL = gql`
  mutation Mutation($reserveHotelId: ID!, $airlinePersonalId: ID!) {
    dissociatePersonFromHotel(reserveHotelId: $reserveHotelId, airlinePersonalId: $airlinePersonalId) {
      id
    }
  }
`;

export const DELETE_PASSENGER_FROM_HOTEL = gql`
  mutation DeletePassengerFromReserve($deletePassengerFromReserveId: ID!) {
    deletePassengerFromReserve(id: $deletePassengerFromReserveId) {
      id
    }
  }
`;

export const UPDATE_RESERVE = gql`
  mutation Mutation($updateReserveId: ID!, $input: UpdateReserveInput!) {
    updateReserve(id: $updateReserveId, input: $input) {
      id
    }
  }
`;

// Запросы к заявкам на резерв

// ----------------------------------------------------------------

// Запросы в гостиницу

export const CREATE_HOTEL = gql`
  mutation Mutation($input: CreateHotelInput!, $images: [Upload!]) {
    createHotel(input: $input, images: $images) {
      id
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
      link
      description
      breakfast {
        start
        end
      }
      lunch {
        start
        end
      }
      dinner {
        start
        end
      }
    }
  }
`;

export const GET_HOTEL_CITY = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      city
    }
  }
`;

export const GET_HOTEL_TARIFS = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      priceOneCategory
      priceTwoCategory
    }
  }
`;

export const GET_HOTEL_MEAL_PRICE = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      MealPrice {
        breakfast
        lunch
        dinner
      }
    }
  }
`;

export const GET_HOTEL_ROOMS = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      rooms {
        id
        name
        category
        places
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
      rooms {
        id
        name
        category
        places
      }
      breakfast {
        start
        end
      }
      lunch {
        start
        end
      }
      dinner {
        start
        end
      }
    }
  }
`;

export const UPDATE_HOTEL_TARIF = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!) {
    updateHotel(id: $updateHotelId, input: $input) {
      priceOneCategory
      priceTwoCategory
    }
  }
`;

export const UPDATE_HOTEL_MEAL_TARIF = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!) {
    updateHotel(id: $updateHotelId, input: $input) {
      MealPrice {
        breakfast
        lunch
        dinner
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
      position
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
      position
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
      position
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

export const GET_AIRLINE_TARIFS = gql`
  query Airline($airlineId: ID!) {
    airline(id: $airlineId) {
      priceOneCategory
      priceTwoCategory
    }
  }
`;

export const GET_AIRLINE_MEAL_PRICE = gql`
  query Airline($airlineId: ID!) {
    airline(id: $airlineId) {
      MealPrice {
        breakfast
        dinner
        lunch
      }
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

export const UPDATE_AIRLINE_TARIF = gql`
  mutation UpdateAirline($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      priceOneCategory
      priceTwoCategory
    }
  }
`;

export const UPDATE_AIRLINE_MEAL_TARIF = gql`
  mutation UpdateAirline($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      MealPrice {
        breakfast
        lunch
        dinner
      }
    }
  }
`;

export const DELETE_AIRLINE_CATEGORY = gql`
  mutation DeleteCategory($deleteCategoryId: ID!) {
    deleteCategory(id: $deleteCategoryId) {
      name
    }
  }
`;

export const DELETE_AIRLINE_TARIFF = gql`
  mutation Mutation($deleteTariffId: ID!) {
    deleteTariff(id: $deleteTariffId) {
      name
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
          position
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
      position
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
        position
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

export const GET_STAFF_HOTELS = gql`
  query AirlineStaffs($airlineStaffsId: ID!) {
    airlineStaffs(id: $airlineStaffsId) {
      name
      number
      position
      gender
      hotelChess {
        start
        end
        clientId
        hotel {
          name
        }
      }
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
      position
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
      position
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
      position
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
      position
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