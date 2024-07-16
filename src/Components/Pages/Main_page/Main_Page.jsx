import React from "react";
import classes from './Main_Page.module.css';
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Estafeta from "../../Blocks/Estafeta/Estafeta";
import { useParams } from "react-router-dom";
import Non_Found_Page from "../Non_Found_Page";
import Placement from "../Placement/Placement"

function Main_Page({ children, ...props }) {
    let { id } = useParams();
    return (
        <div className={classes.main}>
            <MenuDispetcher />
            
            {(id == 'relay' || !id) && <Estafeta />}
        </div>
    );
}

export default Main_Page;