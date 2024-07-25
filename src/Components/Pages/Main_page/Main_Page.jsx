import React, { useState } from "react";
import classes from './Main_Page.module.css';
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Estafeta from "../../Blocks/Estafeta/Estafeta";
import { useParams } from "react-router-dom";
import Reserve from "../../Blocks/Reserve/Reserve";

function Main_Page({ children, ...props }) {
    let { id } = useParams();

    return (
        <div className={classes.main}>
            <MenuDispetcher id={id} />
            
            {(id == 'relay' || !id) && <Estafeta />}
            {(id == 'reserve') && <Reserve />}
        </div>
    );
}

export default Main_Page;