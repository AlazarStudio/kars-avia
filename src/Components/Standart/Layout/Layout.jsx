import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../../Blocks/Header/Header"
import Footer from "../../Blocks/Footer/Footer";


function Empty({ children, ...props }) {
    return (
        <>
            <Outlet />
        </>
    );
}

export default Empty;