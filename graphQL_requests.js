import { gql } from "@apollo/client";

// export const path = '192.168.0.113:4000';
// export const path = '89.169.39.59:4000';

// export const path = 'backend.karsavia.ru:443';
// export const server = `https://${path}`;

// export const path = '192.168.0.14:4000';
// export const server = `http://${path}`;

export const path = '45.130.42.244:4000';
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

// Запросы на сброс пароля

export const REQUEST_RESET_PASSWORD = gql`
  mutation RequestResetPassword($email: String!) {
    requestResetPassword(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

// Запросы на сброс пароля

// ----------------------------------------------------------------

//
export const GET_ALL_POSITIONS = gql`
  query getAllPositions {
    getAllPositions {
      id
      name
    }
  }
`;

export const GET_AIRLINE_USERS_POSITIONS = gql`
  query GetAirlineUserPositions {
    getAirlineUserPositions {
      id
      name
      separator
    }
  }
`;

export const GET_AIRLINE_POSITIONS = gql`
  query GetAirlinePositions {
    getAirlinePositions {
      id
      name
      separator
    }
  }
`;

export const GET_HOTEL_POSITIONS = gql`
  query GetHotelPositions {
    getHotelPositions {
      id
      name
      separator
    }
  }
`;

export const GET_DISPATCHER_POSITIONS = gql`
  query GetDispatcherPositions {
    getDispatcherPositions {
      id
      name
      separator
    }
  }
`;
//

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
        arrival
        departure
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
          position {
            id
            name
          }
          gender
        }
        airline {
          id
          name
          images
        }
        reserve
        requestNumber
        chat {
          unreadMessagesCount
          airlineId
          hotelId
        }
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
          arrival
          departure
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
            position {
              id
              name
            }
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
          arrival
          departure
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
            position {
              id
              name
            }
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
            room {
              id
              name
              category
              places
              active
              reserve
              description
              descriptionSecond
              images
            }
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
          arrival
          departure
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
            position {
              id
              name
            }
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
            room {
              id
              name
              category
              places
              active
              reserve
              description
              descriptionSecond
              images
            }
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
        position {
          id
          name
        }
      }
      createdAt
    }
  }
`;

export const QUERY_NOTIFICATIONS = gql`
  query Notifications($pagination: PaginationInput) {
    getAllNotifications(pagination: $pagination) {
      notifications {
        id
        createdAt
        requestId
        reserveId
        description {
          action
          description
          reason
        }
        request {
          requestNumber
          person {
            id
            name
          }
        }
        reserve {
          reserveNumber
        }
        readBy {
          id
          user {
            id
            name
          }
          readAt
        }
        chatId
      }
      totalCount
      totalPages
    }
  }
`;

export const NOTIFICATIONS_SUBSCRIPTION = gql`
  subscription Notifications {
    notification {
      ... on ExtendRequestNotification {
        requestId
        newStart
        newEnd
        airline {
          name
        }
      }
      ... on RequestCreatedNotification {
        requestId
        arrival
        departure
        airline {
          name
        }
      }
      ... on ReserveCreatedNotification {
        reserveId
        arrival
        departure
        airline {
          name
        }
      }
      ... on ReserveUpdatedNotification {
        reserveId
        arrival
        departure
        airline {
          name
        }
      }
      ... on MessageSentNotification {
        chat {
          id
        }
        text
      }
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
          arrival
          departure
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
            position {
              id
              name
            }
            gender
          }
          airline {
            name
            images
          }
          reserve
        }
    }
`;

export const GET_AIRLINES_RELAY = gql` 
query Airlines { 
  airlines(pagination: {all: true}) { 
    airlines { 
      id 
      name 
      staff { 
        id 
        name 
        position {
          id
          name
        }
        gender 
        number 
      } 
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

export const GET_CITIES = gql`
  query Citys {
    citys {
      id
      city
      region
    }
  }
`;

export const GET_HOTELS_RELAY = gql`
  query Hotels {
    hotels(pagination: {all: true}) {
      hotels {
        id
        name
        information {
          city
        }
      }
    }
  }
`;

export const GET_REQUEST = gql`
  query Query($pagination: LogPaginationInput, $requestId: ID) {
    request(id: $requestId) {
      id
      airportId
      airport {
        id
        name
        city
        code
      }
      arrival
      departure
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
      logs(pagination: $pagination) {
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
        totalCount
        totalPages
      }
      person {
        id
        name
        number
        position {
          id
          name
        }
        gender
      }
      airline {
        id
        name
        images
      }
      requestNumber
      hotel {
        id
        name
      }
      hotelChess {
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
        place
      }
      chat {
        unreadMessagesCount
        airlineId
        hotelId
      }
    }
  }
`;

export const CANCEL_REQUEST = gql`
  mutation CancelRequest($cancelRequestId: ID!) {
    cancelRequest(id: $cancelRequestId) {
      id
      status
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
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
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
        status
        public
        start
        end
        place
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
        client {
          id
          name
          number
          position {
            id
            name
          }
          gender
        }
        passenger {
          id
          name
          number
          gender
        }
        request {
          id
          airport {
            city
            code
            name
          }
          arrival
          departure
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
        reserve {
          id
          airport {
            city
            code
            name
          }
          arrival
          departure
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
          reserveNumber
        }
      }
    }
  }
`;

export const GET_MESSAGES_HOTEL = gql`
  query Chats($requestId: ID, $reserveId: ID) {
    chats(requestId: $requestId, reserveId: $reserveId) {
      id
      separator
      hotelId
      hotel {
        name
      }
      airlineId
      unreadMessagesCount
      messages {
        id
        separator
        text
        createdAt
        sender {
          id
          name
          role
          position {
            id
            name
          }
        }
        readBy {
          user {
            id
            name
          }
        }
      }
    }
  }
`;

export const MARK_MESSAGE_AS_READ = gql`
  mutation markMessageAsRead($messageId: ID!, $userId: ID!) {
    markMessageAsRead(messageId: $messageId, userId: $userId) {
      id
      message {
        text
        sender {
          name
        }
      }
      user {
        name
      }
      readAt
    }
  }
`;

export const MARK_ALL_MESSAGES_AS_READ = gql`
  mutation MarkAllMessagesAsRead($chatId: ID!, $userId: ID!) {
    markAllMessagesAsRead(chatId: $chatId, userId: $userId)
  }
`;

export const UPDATE_MESSAGE_BRON = gql`
  mutation ($chatId: ID!, $senderId: ID!, $text: String!) {
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
        position {
          id
          name
        }
      }
      airport {
        name
      }
      id
      arrival
      hotel {
        name
      }
    }
  }
`;

export const GET_HOTEL_LOGS = gql`
  query Hotel($pagination: LogPaginationInput, $hotelId: ID!) {
    hotel(id: $hotelId) {
      id
      name
      logs(pagination: $pagination) {
        totalCount
        totalPages
        logs {
          createdAt
          id
          description
          action
          oldData
          newData
          user {
            name
            role
          }
        }
      }
    }
  }
`;

export const GET_AIRLINE_LOGS = gql`
  query Airline($pagination: LogPaginationInput, $airlineId: ID!) {
    airline(id: $airlineId) {
      id
      name
      logs(pagination: $pagination) {
        totalCount
        totalPages
        logs {
          id
          description
          createdAt
          action
          newData
          oldData
          user {
            name
            role
          }
        }
      }
    }
  }
`;

export const GET_RESERVE_LOGS = gql`
  query Reserve($reserveId: ID!, $pagination: LogPaginationInput) {
    reserve(id: $reserveId) {
      logs(pagination: $pagination) {
        logs {
          id
          newData
          oldData
          description
          createdAt
          action
          user {
            name
            role
          }
        }
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
      arrival
      departure
      hotelChess {
        start
        end
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
        }
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

export const EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION = gql`
  subscription Notification {
    notification {
      ... on ExtendRequestNotification {
        requestId
        newStart
        newEnd
        dispatcherId
      }
    }
  }
`;

export const CHANGE_TO_ARCHIVE = gql`
  mutation Mutation($archivingRequstId: ID!) {
    archivingRequest(id: $archivingRequstId) {
      id
    }
  }
`;


// Запросы к заявкам на эстафету

// ----------------------------------------------------------------

// Запросы к заявкам на резерв

export const CREATE_REQUEST_RESERVE_MUTATION = gql`
  mutation CreateReserve($input: CreateReserveInput!, $files: [Upload!]) {
    createReserve(input: $input, files: $files) {
      id
      airport {
        id
        name
        city
        code
      }
      arrival
      departure
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
        hotel {
          hotel {
            id
          }
          capacity
        }
        airport {
          id
          name
          city
          code
        }
        arrival
        departure
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
        airline {
          name
          images
        }
        reserveNumber
        passengerCount
        files
        chat {
          unreadMessagesCount
          hotelId
          airlineId
        }
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
      arrival
      departure
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
      chat {
        unreadMessagesCount
      }
    }
  }
`;
export const REQUEST_RESERVE_UPDATED_SUBSCRIPTION1 = gql`
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
      arrival
      departure
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
      arrival
      departure
      hotelChess {
        id
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
      airline {
        id
        name
        images
      }
      reserveNumber
      passengerCount
      files
      passengerList
      chat {
        unreadMessagesCount
        hotelId
        airlineId
      }
    }
  }
`;

export const CREATE_RESERVE_REPORT = gql`
  mutation GenerateReserveReport($reserveId: ID!, $format: ReportFormat!) {
    generateReservePassengerFile(reserveId: $reserveId, format: $format) {
      url
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
        information {
          city
        }
      }
      hotelChess {
        status
        passenger {
          id
          name
        }
        client {
          id
          name
        }
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
      }
      passengers {
        id
        name
        number
        gender
      }
      capacity
      reserve {
        id
        arrival
        departure
        airline {
          name
          images
        }
        hotelChess {
          status
          passenger {
            id
            name
          }
          client {
            id
            name
          }
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
        }
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
        information {
          city
        }
      }
      passengers {
        id
        name
        number
        gender
      }
      capacity
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
        passengers {
          id
          name
          number
          gender
        }
      }
      passengers {
        id
        name
        number
        gender
      }
    }
  }
`;
export const GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT = gql`
  subscription ReservePersons {
    reservePersons {
      reserveHotel {
        id
        passengers {
          id
          name
          number
          gender
        }
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
  mutation Mutation($updateReserveId: ID!, $input: UpdateReserveInput!, $files: [Upload!]) {
    updateReserve(id: $updateReserveId, input: $input, files: $files) {
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
      information {
        address
        city
      }
      stars
      usStars
      airportDistance
    }
  }
`;

export const GET_HOTELS = gql`
  query Hotels($pagination: HotelPaginationInput) {
    hotels(pagination: $pagination) {
      totalCount
      totalPages
      hotels {
        id
        name
        capacity
        information {
          city
          address
        }
        quote
        provision
        images
        stars
        usStars
        airportDistance    
      }
    }
  }
`;

export const GET_HOTELS_SUBSCRIPTION = gql`
  subscription Subscription {
    hotelCreated {
      id
      name
      information {
        city
        address
      }
      quote
      provision
      images
      stars
      airportDistance
    }
  }
`;

export const GET_HOTELS_UPDATE_SUBSCRIPTION = gql`
  subscription Subscription {
    hotelUpdated {
      id
      name
      information {
        city
        address
      }
      quote
      provision
      images
      stars
      airportDistance
    }
  }
`;

export const GET_HOTEL = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      id
      name
      capacity
      type
      stars
      usStars
      airport {
        id
        name
        code
      }
      airportDistance
      information {
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
        link
        description
      }
      images
      gallery
      roomKind {
        id
        name
        category
        price
        description
        images
      }
      rooms {
        id
        type
        name
        beds
        category
        active
        places
        reserve
        description
        images
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

export const GET_HOTEL_CITY = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      information {
        city
      }
    }
  }
`;

// export const GET_HOTEL_TARIFS = gql`
//   query Hotel($hotelId: ID!) {
//     hotel(id: $hotelId) {
//       prices {
//         priceOneCategory
//         priceTwoCategory
//         priceThreeCategory
//         priceFourCategory
//         priceFiveCategory
//         priceSixCategory
//         priceSevenCategory
//         priceEightCategory
//       }
//     }
//   }
// `;

export const GET_HOTEL_TARIFS = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      roomKind {
        id
        name
        description
        category
        price
        images
      }
    }
  }
`;

export const GET_HOTEL_MEAL_PRICE = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      mealPrice {
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
      type
      rooms {
        id
        roomKind {
          id
          name
        }
        name
        type
        price
        category
        beds
        places
        active
        reserve
        description
        images
        descriptionSecond
      }
    }
  }
`;

export const GET_HOTEL_NAME = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      name
      type
    }
  }
`;

export const UPDATE_HOTEL = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!, $images: [Upload!], $roomImages: [Upload!], $gallery: [Upload!]) {
    updateHotel(id: $updateHotelId, input: $input, images: $images, roomImages: $roomImages, gallery: $gallery) {
      rooms {
        id
        name
        category
        beds
        places
        reserve
        active
        description
        images
      }
      airport {
        id
        name
        code
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
      images
      gallery
    }
  }
`;

export const CREATE_MANY_ROOMS = gql`
mutation CreateManyRooms($input: ManyRoomsInput) {
  createManyRooms(input: $input) {
    id
    name
  }
}
`;

// export const UPDATE_HOTEL_TARIF = gql`
//   mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!) {
//     updateHotel(id: $updateHotelId, input: $input) {
//       prices {
//         priceOneCategory
//         priceTwoCategory
//         priceThreeCategory
//         priceFourCategory
//         priceFiveCategory
//         priceSixCategory
//         priceSevenCategory
//         priceEightCategory
//       }
//     }
//   }
// `;
export const UPDATE_HOTEL_TARIF = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!, $roomKindImages: [Upload!]) {
    updateHotel(id: $updateHotelId, input: $input, roomKindImages: $roomKindImages) {
      id
      roomKind {
        id
        name
        description
        category
        price
        images
      }
    }
  }
`;

export const UPDATE_HOTEL_MEAL_TARIF = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!) {
    updateHotel(id: $updateHotelId, input: $input) {
      mealPrice {
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

// export const DELETE_HOTEL_TARIFF = gql`
//   mutation Mutation($deleteTariffId: ID!) {
//     deleteTariff(id: $deleteTariffId) {
//       name
//     }
//   }
// `;

export const DELETE_HOTEL_TARIFF = gql`
  mutation DeleteRoomKind($deleteRoomKindId: ID!) {
    deleteRoomKind(id: $deleteRoomKindId) {
      id
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

export const DELETE_HOTEL = gql`
  mutation DeleteHotel($deleteHotelId: ID!) {
    deleteHotel(id: $deleteHotelId) {
      id
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
      position {
        id
        name
      }
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
      position {
        id
        name
      }
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
      position {
        id
        name
      }
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
  query Airlines($pagination: AirlinePaginationInput) {
    airlines(pagination: $pagination) {
      totalCount
      totalPages
      airlines {
        id
        images
        name
        nameFull
      }
    }
  }
`;

export const GET_AIRLINES_SUBSCRIPTION = gql`
  subscription Subscription {
    airlineCreated {
      id
      images
      name
    }
  }
`;

export const GET_AIRLINES_UPDATE_SUBSCRIPTION = gql`
  subscription Subscription {
    airlineUpdated {
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
      nameFull
      images
      information {
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
        description
        link
      }
      staff {
        id
        name
        gender
        position {
          id
          name
        }
      }
    }
  }
`;

// export const GET_AIRLINE_TARIFS = gql`
//   query Airline($airlineId: ID!) {
//     airline(id: $airlineId) {
//       prices {
//         priceOneCategory
//         priceTwoCategory
//         priceThreeCategory
//         priceFourCategory
//         priceFiveCategory
//         priceSixCategory
//         priceSevenCategory
//         priceEightCategory
//         priceApartment
//         priceStudio
//       }
//     }
//   }
// `;

export const GET_AIRLINE_TARIFS = gql`
  query Airline($airlineId: ID!) {
    airline(id: $airlineId) {
      prices {
        airports {
          id
          airport {
            id
            name
            code
            city
          }
        }
        id
        name
        prices {
          priceApartment
          priceStudio
          priceOneCategory
          priceTwoCategory
          priceThreeCategory
          priceFourCategory
          priceFiveCategory
          priceSixCategory
          priceSevenCategory
          priceEightCategory
        }
        mealPrice {
          breakfast
          dinner
          lunch
        }
      }
    }
  }
`;

// export const GET_AIRLINE_MEAL_PRICE = gql`
//   query Airline($airlineId: ID!) {
//     airline(id: $airlineId) {
//       mealPrice {
//         breakfast
//         dinner
//         lunch
//       }
//     }
//   }
// `;

export const UPDATE_AIRLINE = gql`
  mutation Mutation($updateAirlineId: ID!, $input: UpdateAirlineInput!, $images: [Upload!]) {
    updateAirline(id: $updateAirlineId, input: $input, images: $images) {
      name
      id
      images
      information {
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
        link
        description
      }
    }
  }
`;

export const UPDATE_AIRLINE_TARIF = gql`
  mutation UpdateAirline($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      id
    }
  }
`;

export const UPDATE_AIRLINE_MEAL_TARIF = gql`
  mutation UpdateAirline($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      mealPrice {
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
          position {
            id
            name
          }
          images
          email
          login
        }
        position {
          id
          name
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
      position {
        id
        name
      }
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
        position {
          id 
          name
        }
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
        position {
          id
          name
        }
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
        hotelChess {
          request {
            requestNumber
          }
        }
        position {
          id
          name
        }
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
        position {
          id
          name
        }
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
      position {
        id
        name
      }
      gender
      hotelChess {
        request {
          requestNumber
        }
        start
        end
        clientId
        requestId
        reserveId
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
      position {
        id
        name
      }
      email
      login
    }
  }
`;

export const GET_DISPATCHERS_SUBSCRIPTION = gql`
  subscription Subscription {
    userCreated {
      id
      name
      images
      role
      position {
        id
        name
      }
      email
      login
      airlineDepartmentId
      hotelId
      dispatcher
      airlineId
      support
    }
  }
`;

export const GET_DISPATCHER = gql`
  query Query($userId: ID!) {
    user(userId: $userId) {
      id
      name
      role
      support
      position {
        id
        name
      }
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
      position {
        id
        name
      }
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
      position {
        id
        name
      }
      login
      images
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!, $images: [Upload!]) {
    updateUser(input: $input, images: $images) {
      id
      name
      email
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

// Отчеты

export const CREATE_REPORT = gql`
  mutation CreateAirlineReport($input: CreateReportInput!) {
    createAirlineReport(input: $input) {
      url
    }
  }
`;

export const CREATE_HOTEL_REPORT = gql`
  mutation CreateHotelReport($input: CreateReportInput!) {
    createHotelReport(input: $input) {
      url
    }
  }
`;

export const GET_AIRLINE_REPORT = gql`
  query GetAirlineReport($filter: ReportFilterInput) {
    getAirlineReport(filter: $filter) {
      airlineId
      reports {
        id
        name
        url
        createdAt
        airlineId
        airline {
          id
          name
          images
        }
        startDate
        endDate
      }
    }
  }
`;

export const GET_REPORTS_SUBSCRIPTION = gql`
  subscription Subscription {
    reportCreated {
      id
      name
    }
  }
`;

export const GET_HOTEL_REPORT = gql`
  query GetHotelReport($filter: ReportFilterInput) {
    getHotelReport(filter: $filter) {
      hotelId
      reports {
        id
        name
        url
        createdAt
        hotelId
        hotel {
          id
          name
          images
        }
        startDate
        endDate
      }
    }
  }
`;


export const DELETE_REPORT = gql`
  mutation DeleteReport($deleteReportId: ID!) {
    deleteReport(id: $deleteReportId) {
      id
    }
  }
`;


// Отчеты



// Поддержка

export const GET_USER_SUPPORT_CHATS = gql`
  query SupportChats {
    supportChats {
      id
      createdAt
      participants {
        id
        name
        images
      }
      messages {
        id
        sender {
          id
          name
          role
        }
        text
        isRead
      }
    }
  }
`;

export const GET_USER_SUPPORT_CHAT = gql`
  query UserSupportChat($userId: ID!) {
    userSupportChat(userId: $userId) {
      id
      participants {
        id
        name
      }
      createdAt
      messages {
        id
        createdAt
        text
        sender {
          id
          name
          role
        }
        isRead
      }
    }
  }
`;

// Поддержка