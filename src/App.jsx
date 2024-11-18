import React, { useEffect, useState } from "react";
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

import Main_Page from "./Components/Pages/Main_page/Main_Page";
import Non_Found_Page from "./Components/Pages/Non_Found_Page";
import Layout from "./Components/Standart/Layout/Layout";
import Placement from "./Components/Pages/Placement/Placement";
import ReservePlacement from "./Components/Pages/ReservePlacement/ReservePlacement";
import NewPlacement from "./Components/Blocks/NewPlacement/NewPlacement";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

import { server, path, getCookie, decodeJWT } from "../graphQL_requests";
import { useAuth } from "./AuthContext";
import Login from "./Components/Pages/Login/Login";

function App() {
  const { user } = useAuth();

  const token = getCookie('token');

  const uploadLink = createUploadLink({
    uri: `${server}/graphql`,
    // credentials: 'include',
  });

  const wsLink = new GraphQLWsLink(
    createClient({
      url: `ws://${path}/graphql`,
      connectionParams: () => {
        if (!token) {
          return {};
        }
        return {
          Authorization: `Bearer ${token}`,
        };
      },
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
      <Routes>
        {user ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Main_Page user={user} />} />
            <Route path="/:id" element={<Main_Page user={user} />} />
            <Route
              path="/hotels/:hotelID"
              element={<Main_Page user={user} />}
            />
            <Route
              path="/airlines/:airlineID"
              element={<Main_Page user={user} />}
            />

            {/* Резерв внутри заявки */}
            <Route
              path="/:id/reservePlacement/:idRequest"
              element={<ReservePlacement user={user} />}
            />

            {/* Шахматка */}
            <Route
              path="/:id/placement/:idHotel"
              element={<Placement user={user} />}
            />

            <Route
              path="/newPlacement"
              element={<NewPlacement />}
            />

            <Route path="*" element={<Non_Found_Page />} />

          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Login />} />
          </>
        )}
      </Routes>
    </ApolloProvider>
  );
}

export default App;
