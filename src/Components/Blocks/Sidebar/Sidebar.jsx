import React from "react";
import classes from './Sidebar.module.css';

function Sidebar({ show, sidebarRef, children }) {

    return (
        <div 
            ref={sidebarRef} 
            className={`${classes.createRequest} ${show ? classes.show : ''}`}
        >
            {children}
        </div>
    );
}

export default Sidebar;
