import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ApolloProvider, ApolloClient, InMemoryCache, split, HttpLink } from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

import Main_Page from "./Components/Pages/Main_page/Main_Page";
import Non_Found_Page from "./Components/Pages/Non_Found_Page";
import Layout from "./Components/Standart/Layout/Layout";
import Placement from "./Components/Pages/Placement/Placement";
import ReservePlacement from "./Components/Pages/ReservePlacement/ReservePlacement";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

import { server, getCookie, decodeJWT } from '../graphQL_requests';

function App() {
  const [user, setUser] = useState('');

  const token = getCookie('token');

  useEffect(() => {
    if (token) {
      setUser(decodeJWT(token));
    }
  }, [token]);

  const uploadLink = createUploadLink({
    uri: `${server}/graphql`,
    // credentials: 'include',
  });

  const wsLink = new GraphQLWsLink(createClient({
    url: 'ws://192.168.0.112:4000/graphql',
    connectionParams: () => {
      if (!token) {
        return {};
      }
      return {
        Authorization: `Bearer ${token}`,
      };
    },
  }));

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    uploadLink,
  );

  const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });

  return (
    <ApolloProvider client={client}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Main_Page user={user} />} />
          <Route path="/:id" element={<Main_Page user={user} />} />
          <Route path="/hotels/:hotelID" element={<Main_Page user={user} />} />
          <Route path="/airlines/:airlineID" element={<Main_Page user={user} />} />
          {/* <Route path="/sendFile" element={<FileUpload />} /> */}

          {/* Резерв внутри заявки */}
          <Route path="/:id/reservePlacement/:idRequest" element={<ReservePlacement user={user} />} />

          {/* Шахматка */}
          <Route path="/:id/placement/:idHotel" element={<Placement user={user} />} />
          <Route path="*" element={<Non_Found_Page />} />
        </Route>
      </Routes>
    </ApolloProvider>
  );
}

export default App;
