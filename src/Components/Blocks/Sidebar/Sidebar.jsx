import React, { useState, useEffect } from "react";
import classes from "./Sidebar.module.css";

function Sidebar({ show, sidebarRef, children }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (show) {
            setTimeout(() => setIsMounted(true), 60); // Даем браузеру 10ms, чтобы применить transition
        } else {
            setIsMounted(false);
        }
    }, [show]);

    return (
        <div
            ref={sidebarRef}
            className={`${classes.createRequest} ${isMounted ? classes.show : ""}`}
        >
            {children}
        </div>
    );
}

export default Sidebar;


// old version
// import React from "react";
// import classes from './Sidebar.module.css';

// function Sidebar({ show, sidebarRef, children }) {

//     return (
//         <div 
//             ref={sidebarRef} 
//             className={`${classes.createRequest} ${show ? classes.show : ''}`}
//         >
//             {children}
//         </div>
//     );
// }

// export default Sidebar;