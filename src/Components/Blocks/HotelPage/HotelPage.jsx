import React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import classes from './HotelPage.module.css';
import Header from "../Header/Header";
import { Link } from "react-router-dom";

import HotelTarifs_tabComponent from "../HotelTarifs_tabComponent/HotelTarifs_tabComponent";
import HotelShahmatka_tabComponent from "../HotelShahmatka_tabComponent/HotelShahmatka_tabComponent";

function HotelPage({ children, id, ...props }) {
    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>
                        <div className={classes.titleHeader}>
                            <Link to={`/hotels`} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>
                            {id}
                        </div>
                    </Header>
                </div>

                <Tabs className={classes.tabs}>
                    <TabList className={classes.tabList}>
                        <Tab className={classes.tab}>Шахматка</Tab>
                        <Tab className={classes.tab}>Тарифы</Tab>
                        <Tab className={classes.tab}>Номерной фонд</Tab>
                        <Tab className={classes.tab}>Компания</Tab>
                        <Tab className={classes.tab}>О гостинице</Tab>
                    </TabList>

                    <TabPanel className={classes.tabPanel}>
                        <HotelShahmatka_tabComponent id={id}/>
                    </TabPanel>

                    <TabPanel className={classes.tabPanel}>
                        <HotelTarifs_tabComponent />
                    </TabPanel>

                    <TabPanel className={classes.tabPanel}>
                        <div>Номерной фонд Content</div>
                    </TabPanel>

                    <TabPanel className={classes.tabPanel}>
                        <div>Компания Content</div>
                    </TabPanel>

                    <TabPanel className={classes.tabPanel}>
                        <div>О гостинице Content</div>
                    </TabPanel>
                </Tabs>
            </div>
        </>
    );
}

export default HotelPage;
