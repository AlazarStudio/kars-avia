import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  split,
  HttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
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
import NewPlacementV2 from "./Components/PlacementDNDV2/NewPlacementV2";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

import { server, path } from "../graphQL_requests";
import { useAuth } from "./AuthContext";
import { authService } from "./services/authService";
import { createAuthErrorLink } from "./services/authErrorLink";
import Login from "./Components/Pages/Login/Login";
import Email from "./Components/Pages/Email/Email";
import ResetPassword from "./Components/Pages/ResetPassword/ResetPassword";
import { TokenRefresher } from "./TokenRefresher";
import { UserActivityTracker } from "./UserActivityTracker";
import ReservePlacementRepresentative from "./Components/Pages/ReservePlacementRepresentative/ReservePlacementRepresentative";
import RepresentativeHotelDetailPage from "./Components/Pages/RepresentativeHotelDetailPage/RepresentativeHotelDetailPage";
import RepresentativeHotelReportPage from "./Components/Pages/RepresentativeHotelReportPage/RepresentativeHotelReportPage";
import RepresentativeDriverDetailPage from "./Components/Pages/RepresentativeDriverDetailPage/RepresentativeDriverDetailPage";
import ExternalLogin from "./Components/Pages/ExternalLogin/ExternalLogin";

const TransferOrder = lazy(() =>
  import("./Components/Blocks/TransferOrder/TransferOrder")
);

function App() {
  const { user } = useAuth();

  const authLink = setContext((operation, { context }) => {
    // External login must run without Bearer so backend gets empty context
    if (operation?.operationName === "AuthorizeExternalAuth") {
      return {
        ...context,
        headers: { ...(context?.headers || {}) },
      };
    }
    const token = authService.getAccessToken();
    return {
      ...context,
      headers: {
        ...(context?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const errorLink = createAuthErrorLink({
    onLogout: () => window.location.replace("/login"),
  });

  const uploadLink = createUploadLink({
    uri: `${server}/graphql`,
  });

  const wsLink = new GraphQLWsLink(
    createClient({
      // url: `wss://${path}/graphql`,
      url: `ws://${path}/graphql`,
      connectionParams: () => {
        const t = authService.getAccessToken();
        return t ? { Authorization: `Bearer ${t}` } : {};
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
    errorLink.concat(authLink).concat(uploadLink)
  );

  const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });

  return (
    <ApolloProvider client={client}>
      <TokenRefresher />
      {/* {user && <UserActivityTracker />} */}
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
            {/* <Route
              path="/:id/reservePlacement/:idRequest"
              element={<ReservePlacement user={user} />}
            /> */}
            <Route
              path="/:id/representativeRequestsPlacement/:idRequest"
              element={<ReservePlacementRepresentative user={user} />}
            />
            <Route
              path="/:id/representativeRequestsPlacement/:idRequest/hotel/:hotelId"
              element={<RepresentativeHotelDetailPage user={user} />}
            />
            <Route
              path="/:id/representativeRequestsPlacement/:idRequest/hotel/:hotelId/report"
              element={<RepresentativeHotelReportPage user={user} />}
            />
            <Route
              path="/:id/representativeRequestsPlacement/:idRequest/driver/:driverIndex"
              element={<RepresentativeDriverDetailPage user={user} />}
            />

            {/* Шахматка */}
            {/* <Route
              path="/:id/placement/:idHotel"
              element={<Placement user={user} />}
            /> */}

            {/* <Route
              path="/orders/:id"
              element={
                <Suspense fallback={<div style={{ padding: 24 }}>Загрузка…</div>}>
                  <TransferOrder user={user} />
                </Suspense>
              }
            /> */}

            <Route path="/newPlacement/:idHotel" element={<NewPlacement />} />
            <Route path="/newPlacementV2/:idHotel" element={<NewPlacementV2 />} />

            <Route path="*" element={<Non_Found_Page />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/external-login" element={<ExternalLogin />} />
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
