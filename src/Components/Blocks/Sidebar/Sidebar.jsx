import React from "react";
import classes from './Sidebar.module.css';

function Sidebar({ show, sidebarRef, children }) {

    let transform = show ? 'translateX(0px)' : 'translateX(500px)';

    return (
        <div ref={sidebarRef} className={classes.createRequest} style={{ transform }}>
            {children}
        </div>
    );
}

export default Sidebar;