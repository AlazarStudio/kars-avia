import React, { useState, useRef } from "react";
import classes from './Reports.module.css';
import Filter from "../Filter/Filter";
import CreateRequestCompany from "../CreateRequestCompany/CreateRequestCompany";
import { requestsReports } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataCompany from "../InfoTableDataCompany/InfoTableDataCompany";
import ExistRequestCompany from "../ExistRequestCompany/ExistRequestCompany";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import InfoTableDataReports from "../InfoTableDataReports/InfoTableDataReports";
import CreateRequestReport from "../CreateRequestReport/CreateRequestReport";
import ExistRequestReport from "../ExistRequestReport/ExistRequestReport";

function Reports({ children, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [chooseObject, setChooseObject] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    
    const deleteComponentRef = useRef();
    
    const [companyData, setCompanyData] = useState(requestsReports);

    const addDispatcher = (newDispatcher) => {
        setCompanyData([...companyData, newDispatcher]);
    };

    const updateDispatcher = (updatedDispatcher, index) => {
        const newData = [...companyData];
        newData[index] = updatedDispatcher;
        setCompanyData(newData);
    };

    const deleteDispatcher = (index) => {
        setCompanyData(companyData.filter((_, i) => i !== index));
        setShowDelete(false);
        setShowRequestSidebar(false);
    };

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const toggleRequestSidebar = () => {
        setShowRequestSidebar(!showRequestSidebar);
    };

    const openDeleteComponent = (index) => {
        setShowDelete(true);
        setDeleteIndex(index);
        setShowRequestSidebar(false); // Закрываем боковую панель при открытии компонента удаления
    };

    const closeDeleteComponent = () => {
        setShowDelete(false);
        setShowRequestSidebar(true); // Открываем боковую панель при закрытии компонента удаления
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
            (
                request.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.dateFormirovania.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.startDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.endDate.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Азимут'];

    return (
        <>
            <div className={classes.section}>
                <div className={classes.section_top}>
                    <Header>Отчеты</Header>
                </div>

                <div className={classes.section_searchAndFilter}>
                    <input
                        type="text"
                        placeholder="Поиск"
                        style={{ width: '500px' }}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <Filter
                        toggleSidebar={toggleCreateSidebar}
                        handleChange={handleChange}
                        filterData={filterData}
                        buttonTitle={'Создать отчет'}
                        filterList={filterList}
                        needDate={false}
                    />
                </div>

                <InfoTableDataReports 
                    toggleRequestSidebar={toggleRequestSidebar} 
                    requests={filteredRequests} 
                    setChooseObject={setChooseObject} 
                    openDeleteComponent={openDeleteComponent}                     
                />

                <CreateRequestReport 
                    show={showCreateSidebar} 
                    onClose={toggleCreateSidebar} 
                    addDispatcher={addDispatcher} 
                />
{/* 
                <ExistRequestReport 
                    show={showRequestSidebar} 
                    onClose={toggleRequestSidebar} 
                    chooseObject={chooseObject} 
                    updateDispatcher={updateDispatcher} 
                    openDeleteComponent={openDeleteComponent} 
                    deleteComponentRef={deleteComponentRef}
                    filterList={filterList}
                /> */}

                {showDelete && (
                    <DeleteComponent
                        ref={deleteComponentRef}
                        remove={() => deleteDispatcher(deleteIndex)}
                        close={closeDeleteComponent}
                        title={`Вы действительно хотите удалить отчет?`}
                    />
                )}
            </div>
        </>
    );
}

export default Reports;
