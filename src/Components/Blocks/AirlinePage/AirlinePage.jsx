import React, { useEffect, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import classes from './AirlinePage.module.css';
import Header from "../Header/Header";
import { Link } from "react-router-dom";

import AirlineCompany_tabComponent from "../AirlineCompany_tabComponent/AirlineCompany_tabComponent";
import AirlineAbout_tabComponent from "../AirlineAbout_tabComponent/AirlineAbout_tabComponent";
import { GET_AIRLINE } from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";

function AirlinePage({ children, id, ...props }) {
    const [selectedTab, setSelectedTab] = useState(0);

    const { loading, error, data } = useQuery(GET_AIRLINE, {
        variables: { airlineId: id },
    });

    useEffect(() => {
        const savedTab = localStorage.getItem('selectedTab');
        if (savedTab !== null) {
            setSelectedTab(parseInt(savedTab, 10));
        }
    }, []);

    const handleTabSelect = (index) => {
        setSelectedTab(index);
        localStorage.setItem('selectedTab', index);
    };
    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>
                        <div className={classes.titleHeader}>
                            <Link to={`/airlines`} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>
                            {data && data.airline.name}
                        </div>
                    </Header>
                </div>

                <Tabs
                    className={classes.tabs}
                    selectedIndex={selectedTab}
                    onSelect={handleTabSelect}
                >
                    <TabList className={classes.tabList}>
                        <Tab className={classes.tab}>Компания</Tab>
                        <Tab className={classes.tab}>Сотрудники</Tab>
                        <Tab className={classes.tab}>О авиакомпании</Tab>
                    </TabList>

                    <TabPanel className={classes.tabPanel}>
                        <AirlineCompany_tabComponent id={id} />
                    </TabPanel>

                    <TabPanel className={classes.tabPanel}>
                        {/* <HotelShahmatka_tabComponent id={id} /> */}
                    </TabPanel>

                    <TabPanel className={classes.tabPanel}>
                        <AirlineAbout_tabComponent id={id} />
                    </TabPanel>
                </Tabs>
            </div>
        </>
    );
}

export default AirlinePage;
