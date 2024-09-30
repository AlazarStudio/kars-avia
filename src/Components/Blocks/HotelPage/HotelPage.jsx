import React, { useEffect, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import classes from './HotelPage.module.css';
import Header from "../Header/Header";
import { Link, useParams } from "react-router-dom";

import HotelTarifs_tabComponent from "../HotelTarifs_tabComponent/HotelTarifs_tabComponent";
import HotelShahmatka_tabComponent from "../HotelShahmatka_tabComponent/HotelShahmatka_tabComponent";
import HotelNomerFond_tabComponent from "../HotelNomerFond_tabComponent/HotelNomerFond_tabComponent";
import HotelCompany_tabComponent from "../HotelCompany_tabComponent/HotelCompany_tabComponent";
import HotelAbout_tabComponent from "../HotelAbout_tabComponent/HotelAbout_tabComponent";
import { useQuery } from "@apollo/client";
import { GET_HOTEL_NAME } from '../../../../graphQL_requests.js';

function HotelPage({ children, id, user, ...props }) {
    let params = useParams();

    const [selectedTab, setSelectedTab] = useState(0);

    const { loading, error, data } = useQuery(GET_HOTEL_NAME, {
        variables: { hotelId: id },
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
                            {user.role == "SUPERADMIN" && <Link to={`/hotels`} className={classes.backButton}><img src="/arrow.png" alt="" /></Link>}
                            {data && data.hotel.name}
                        </div>
                    </Header>
                </div>
                <Tabs
                    className={classes.tabs}
                    selectedIndex={selectedTab}
                    onSelect={handleTabSelect}
                >
                    {user.role == "SUPERADMIN" &&
                        <>
                            <TabList className={classes.tabList}>
                                <Tab className={classes.tab}>Шахматка</Tab>
                                <Tab className={classes.tab}>Тарифы</Tab>
                                <Tab className={classes.tab}>Номерной фонд</Tab>
                                <Tab className={classes.tab}>Компания</Tab>
                                <Tab className={classes.tab}>О гостинице</Tab>
                            </TabList>

                            <TabPanel className={classes.tabPanel}>
                                <HotelShahmatka_tabComponent id={id} />
                            </TabPanel>

                            <TabPanel className={classes.tabPanel}>
                                <HotelTarifs_tabComponent id={id} />
                            </TabPanel>

                            <TabPanel className={classes.tabPanel}>
                                <HotelNomerFond_tabComponent id={id} />
                            </TabPanel>

                            <TabPanel className={classes.tabPanel}>
                                <HotelCompany_tabComponent id={id} />
                            </TabPanel>

                            <TabPanel className={classes.tabPanel}>
                                <HotelAbout_tabComponent id={id} />
                            </TabPanel>
                        </>
                    }
                    {user.role == "HOTELADMIN" &&
                        <>
                            {(params.id == 'hotelChess' || params.id == undefined) &&
                                <div className={classes.tabPanel}>
                                    <HotelShahmatka_tabComponent id={id} />
                                </div>
                            }
                            {params.id == 'hotelTarifs' &&
                                <div className={classes.tabPanel}>
                                    <HotelTarifs_tabComponent id={id} />
                                </div>
                            }
                            {params.id == 'hotelRooms' &&
                                <div className={classes.tabPanel}>
                                    <HotelNomerFond_tabComponent id={id} />
                                </div>
                            }
                            {params.id == 'hotelCompany' &&
                                <div className={classes.tabPanel}>
                                    <HotelCompany_tabComponent id={id} />
                                </div>
                            }
                            {params.id == 'hotelAbout' &&
                                <div className={classes.tabPanel}>
                                    <HotelAbout_tabComponent id={id} />
                                </div>
                            }
                        </>
                    }
                </Tabs>
            </div>
        </>
    );
}

export default HotelPage;
