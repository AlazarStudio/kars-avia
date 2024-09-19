import React from "react";
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
import FileUpload from "./Components/Blocks/FileUpload/FileUpload";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

const uploadLink = createUploadLink({
  uri: 'http://192.168.0.112:4000/graphql',
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://192.168.0.112:4000/graphql',
  connectionParams: () => {
    const session = JSON.parse(localStorage.getItem('session')) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NmVjMDFhNjk4MjEyNmU5YjlkOTNjOWIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MjY3NjA3OTh9.pUmBA3XmuUROXeHuiBO6EsntZkTo35_1t5Zpq3xagKs";
    // console.log(session);
    if (!session) {
      return {};
    }
    return {
      Authorization: `${session.token}`,
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
  uploadLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Main_Page />} />
          <Route path="/:id" element={<Main_Page />} />
          <Route path="/hotels/:hotelID" element={<Main_Page />} />
          <Route path="/airlines/:airlineID" element={<Main_Page />} />
          <Route path="/sendFile" element={<FileUpload />} />

          {/* Резерв внутри заявки */}
          <Route path="/:id/reservePlacement/:idRequest" element={<ReservePlacement />} />

          {/* Шахматка */}
          <Route path="/:id/placement/:idHotel" element={<Placement />} />
          <Route path="*" element={<Non_Found_Page />} />
        </Route>
      </Routes>
    </ApolloProvider>
  );
}

export default App;
