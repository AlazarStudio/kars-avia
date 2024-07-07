import React from "react";
import { Outlet } from "react-router-dom";

function Empty({ children, ...props }) {
    return (
        <>
            <Outlet />
        </>
    );
}

export default Empty;