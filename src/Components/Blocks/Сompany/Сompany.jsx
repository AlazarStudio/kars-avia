import React, { useState } from "react";
import classes from './Сompany.module.css';
import Filter from "../Filter/Filter";
import CreateRequestCompany from "../CreateRequestCompany/CreateRequestCompany";

import { requestsCompany } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataCompany from "../InfoTableDataCompany/InfoTableDataCompany";
import ExistRequest from "../ExistRequest/ExistRequest";

function Сompany({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [showChooseHotel, setShowChooseHotel] = useState(false);
    const [chooseObject, setChooseObject] = useState([]);
    
    const [companyData, setCompanyData] = useState(requestsCompany);

    const addDispatcher = (newDispatcher) => {
        setCompanyData([...companyData, newDispatcher]);
    };

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const toggleRequestSidebar = () => {
        setShowRequestSidebar(!showRequestSidebar);
    };
    const [filterData, setFilterData] = useState({
        filterSelect: '',
    });

    const [searchQuery, setSearchQuery] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }


    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    const filteredRequests = companyData.filter(request => {
        return (
            (filterData.filterSelect === '' || request.post.includes(filterData.filterSelect)) &&
            (
                request.fio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.post.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Модератор', 'Администратор']

    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>Компания</Header>
                </div>

                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ 'width': '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <Filter
                        toggleSidebar={toggleCreateSidebar}
                        handleChange={handleChange}
                        filterData={filterData}
                        buttonTitle={'Добавить аккаунт диспетчера'}
                        filterList={filterList}
                        needDate={false}
                    />
                </div>

                <InfoTableDataCompany toggleRequestSidebar={toggleRequestSidebar} requests={filteredRequests} setChooseObject={setChooseObject} />

                <CreateRequestCompany show={showCreateSidebar} onClose={toggleCreateSidebar} addDispatcher={addDispatcher} />
                <ExistRequest show={showRequestSidebar} onClose={toggleRequestSidebar} setShowChooseHotel={setShowChooseHotel} />
            </div>
        </>
    );
}

export default Сompany;
