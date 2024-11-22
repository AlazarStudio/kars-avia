import React, { useEffect, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import classes from './AirlinePage.module.css';
import Header from "../Header/Header";
import { Link, useParams } from "react-router-dom";

import AirlineCompany_tabComponent from "../AirlineCompany_tabComponent/AirlineCompany_tabComponent";
import AirlineAbout_tabComponent from "../AirlineAbout_tabComponent/AirlineAbout_tabComponent";
import { GET_AIRLINE } from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import AirlineShahmatka_tabComponent_Staff from "../AirlineShahmatka_tabComponent_Staff/AirlineShahmatka_tabComponent_Staff";

function AirlinePage({ children, id, user, ...props }) {
    let params = useParams();

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
                <Header>
                    <div className={classes.titleHeader}>
                        {(user.role === 'SUPERADMIN' || user.role === 'DISPATCHERADMIN') && <Link to={`/airlines`} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>}
                        {data && data.airline.name}
                    </div>
                </Header>

                {(user.role === 'SUPERADMIN' || user.role === 'DISPATCHERADMIN') &&
                    <>
                        <Tabs
                            className={classes.tabs}
                            selectedIndex={selectedTab}
                            onSelect={handleTabSelect}
                        >
                            <TabList className={classes.tabList}>
                                <Tab className={classes.tab}>Компания</Tab>
                                <Tab className={classes.tab}>Экипаж</Tab>
                                <Tab className={classes.tab}>О авиакомпании</Tab>
                            </TabList>

                            <TabPanel className={classes.tabPanel}>
                                <AirlineCompany_tabComponent id={id} />
                            </TabPanel>

                            <TabPanel className={classes.tabPanel}>
                                <AirlineShahmatka_tabComponent_Staff id={id} />
                            </TabPanel>

                            <TabPanel className={classes.tabPanel}>
                                <AirlineAbout_tabComponent id={id} />
                            </TabPanel>
                        </Tabs>
                    </>
                }
                {user.role == "AIRLINEADMIN" &&
                    <>
                        {(params.id == 'airlineCompany' || params.id == undefined) &&
                            <div className={classes.tabPanel}>
                                <AirlineCompany_tabComponent id={id} />
                            </div>
                        }
                        {params.id == 'airlineStaff' &&
                            <div className={classes.tabPanel}>
                                <AirlineShahmatka_tabComponent_Staff id={id} />
                            </div>
                        }
                        {params.id == 'airlineAbout' &&
                            <div className={classes.tabPanel}>
                                <AirlineAbout_tabComponent id={id} />
                            </div>
                        }
                    </>
                }
            </div>
        </>
    );
}

export default AirlinePage;
