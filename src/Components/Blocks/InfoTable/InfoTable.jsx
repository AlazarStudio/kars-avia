import React from "react";
import classes from './InfoTable.module.css';

function InfoTable({ children, ...props }) {
    return ( 
        <div className={classes.InfoTable}>
            {children}
        </div>
     );
}

export default InfoTable;