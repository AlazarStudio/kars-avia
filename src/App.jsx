import React from "react";
import { Route, Routes } from "react-router-dom";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  split,
  HttpLink,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

import "react-date-range/dist/styles.css"; // основной стиль
import "react-date-range/dist/theme/default.css"; // тема по умолчанию

import Main_Page from "./Components/Pages/Main_page/Main_Page";
import Non_Found_Page from "./Components/Pages/Non_Found_Page";
import Layout from "./Components/Standart/Layout/Layout";
import Placement from "./Components/Pages/Placement/Placement";
import ReservePlacement from "./Components/Pages/ReservePlacement/ReservePlacement";
import NewPlacement from "./Components/PlacementDND/NewPlacement/NewPlacement";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

import { server, path, getCookie } from "../graphQL_requests";
import { useAuth } from "./AuthContext";
import Login from "./Components/Pages/Login/Login";
import Email from "./Components/Pages/Email/Email";
import ResetPassword from "./Components/Pages/ResetPassword/ResetPassword";
import { TokenRefresher } from "./TokenRefresher";
import ReservePlacementRepresentative from "./Components/Pages/ReservePlacementRepresentative/ReservePlacementRepresentative";
import TransferOrder from "./Components/Blocks/TransferOrder/TransferOrder";

function App() {
  const { user } = useAuth();

  const token = getCookie("token");

  const uploadLink = createUploadLink({
    uri: `${server}/graphql`,
    // credentials: 'include',
  });

  const wsLink = new GraphQLWsLink(
    createClient({
      url: `wss://${path}/graphql`,
      // url: `ws://${path}/graphql`,
      connectionParams: {
        Authorization: `Bearer ${token}`,
      },
      // connectionParams: () => {
      // if (!token) {
      //   return {};
      // }
      // return {
      //   Authorization: `Bearer ${token}`,
      // };
      // },
    })
  );

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    wsLink,
    uploadLink
  );

  const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });

  return (
    <ApolloProvider client={client}>
      {/* <TokenRefresher /> */}
      <Routes>
        {user ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Main_Page user={user} />} />
            <Route path="/:id" element={<Main_Page user={user} />} />
            <Route
              path="/orders/:orderId"
              element={<Main_Page user={user} />}
            />
            <Route
              path="/hotels/:hotelID/:requestId"
              element={<Main_Page user={user} />}
            />
            <Route
              path="/hotels/:hotelID"
              element={<Main_Page user={user} />}
            />
            <Route
              path="/airlines/:airlineID"
              element={<Main_Page user={user} />}
            />
            <Route
              path="/driversCompany/:driversCompanyID"
              element={<Main_Page user={user} />}
            />

            {/* Резерв внутри заявки */}
            <Route
              path="/:id/reservePlacement/:idRequest"
              element={<ReservePlacement user={user} />}
            />
            {/* <Route
              path="/:id/representativeRequestsPlacement/:idRequest"
              element={<ReservePlacementRepresentative user={user} />}
            /> */}

            {/* Шахматка */}
            {/* <Route
              path="/:id/placement/:idHotel"
              element={<Placement user={user} />}
            /> */}

            {/* <Route
              path="/orders/:id"
              element={<TransferOrder user={user} />}
            /> */}

            <Route path="/newPlacement/:idHotel" element={<NewPlacement />} />

            <Route path="*" element={<Non_Found_Page />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-to-email" element={<Email />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Login />} />
          </>
        )}
      </Routes>
    </ApolloProvider>
  );
}

export default App;
