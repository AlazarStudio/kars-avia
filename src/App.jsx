import React from "react";
import { Route, Routes } from "react-router-dom";

import Main_Page from "./Components/Pages/Main_page/Main_Page";
import Non_Found_Page from "./Components/Pages/Non_Found_Page";
import Layout from "./Components/Standart/Layout/Layout";
import Placement from "./Components/Pages/Placement/Placement";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Main_Page />} />
          <Route path="/:id" element={<Main_Page />} />
          <Route path="/placement/:idHotel" element={<Placement />} />
          <Route path="*" element={<Non_Found_Page />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
