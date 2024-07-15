import React from "react";
import classes from './Sidebar.module.css';

function Sidebar({ show, transform, sidebarRef, children }) {
    return (
        <div ref={sidebarRef} className={classes.createRequest} style={{ transform }}>
            {children}
        </div>
    );
}

export default Sidebar;