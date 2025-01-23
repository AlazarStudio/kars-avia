import React from "react";
import classes from './InfoTable.module.css';

function InfoTable({ children, isScroll, ...props }) {
    return ( 
        <div className={`${classes.InfoTable} ${isScroll ? classes.isScroll : ''}`}>
            {children}
        </div>
     );
}

export default InfoTable;