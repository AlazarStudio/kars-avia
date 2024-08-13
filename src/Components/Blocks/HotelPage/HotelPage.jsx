import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import classes from './HotelPage.module.css';
import Header from "../Header/Header";
import { Link } from "react-router-dom";
import HotelTablePageComponent from "../HotelTablePageComponent/HotelTablePageComponent";
import Filter from "../Filter/Filter";

function HotelPage({ children, id, ...props }) {
    const dataObject = [
        {
            room: '',
            place: '',
            start: '',
            startTime: '',
            end: '',
            endTime: '',
            client: '',
            public: false,
        }
    ];

    const allRooms = [
        { room: '№121', places: 1 },
        { room: '№122', places: 1 },
        { room: '№221', places: 2 },
        { room: '№222', places: 2 },
    ];

    const data = [
        { public: true, room: '№121', place: 1, start: '2024-08-01', startTime: '14:00', end: '2024-08-10', endTime: '10:00', client: 'Джатдоев А. С-А.' },
        { public: true, room: '№121', place: 1, start: '2024-08-10', startTime: '14:00', end: '2024-08-26', endTime: '10:00', client: 'Джатдоев А. С-А.' },
        { public: true, room: '№121', place: 1, start: '2024-08-26', startTime: '14:00', end: '2024-08-29', endTime: '10:00', client: 'Джатдоев А. С-А.' },
        { public: true, room: '№122', place: 1, start: '2024-08-03', startTime: '14:00', end: '2024-08-10', endTime: '10:00', client: 'Гочияев Р. Р.' },
        { public: true, room: '№221', place: 1, start: '2024-08-12', startTime: '14:00', end: '2024-08-29', endTime: '10:00', client: 'Уртенов А. З.' },
        { public: true, room: '№221', place: 2, start: '2024-08-10', startTime: '14:00', end: '2024-08-19', endTime: '10:00', client: 'Джатдоев А. С-А.' },
        { public: true, room: '№222', place: 1, start: '2024-08-12', startTime: '14:00', end: '2024-08-18', endTime: '10:00', client: 'Гочияев Р. Р.' },
        { public: true, room: '№222', place: 2, start: '2024-07-12', startTime: '14:00', end: '2024-08-24', endTime: '10:00', client: 'Гочияев Р. Р.' },
    ];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectQuery, setSelectQuery] = useState('');
    const [showAddBronForm, setShowAddBronForm] = useState(false);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    const handleSelect = (e) => {
        setSelectQuery(e.target.value);
    }

    const toggleSidebar = () => {
        setShowAddBronForm(!showAddBronForm)
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    const filteredRequests = allRooms.filter(request => {
        const matchesRoom = request.room.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlaces = selectQuery === '' || request.places === parseInt(selectQuery);

        const matchingClients = data.filter(entry =>
            entry.client.toLowerCase().includes(searchQuery.toLowerCase()) &&
            entry.room === request.room
        );

        const matchesClient = matchingClients.length > 0;

        return (matchesRoom || matchesClient) && matchesPlaces;
    });

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
                        <div className={classes.section_searchAndFilter}>
                            <input
                                type="text"
                                placeholder="Поиск по номеру комнаты или ФИО клиента"
                                style={{ 'width': '500px' }}
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                            <div className={classes.section_searchAndFilter_filter}>
                                <select onChange={handleSelect}>
                                    <option value="">Показать все</option>
                                    <option value="1">1 - МЕСТНЫЕ</option>
                                    <option value="2">2 - МЕСТНЫЕ</option>
                                </select>

                                <Filter
                                    toggleSidebar={toggleSidebar}
                                    handleChange={handleChange}
                                    buttonTitle={'Добавить бронь'}
                                />
                            </div>
                        </div>
                        <HotelTablePageComponent allRooms={filteredRequests} data={data} idHotel={id} dataObject={dataObject} id={'hotels'} showAddBronForm={showAddBronForm} />
                    </TabPanel>

                    <TabPanel className={classes.tabPanel}>
                        <div>Тарифы Content</div>
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
