import React from "react";
import classes from './Placement.module.css';
import { useParams } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";

function Placement({ children, ...props }) {
    let { idHotel } = useParams();
    return (
        <div className={classes.main}>
            <MenuDispetcher />

            
        </div>
    );
}

export default Placement;