import React from "react";
import classes from './Main_Page.module.css';
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Estafeta from "../../Blocks/Estafeta/Estafeta";

function Main_Page({ children, ...props }) {
    return (
        <div className={classes.main}>
            <MenuDispetcher />
            <Estafeta />
        </div>
    );
}

export default Main_Page;