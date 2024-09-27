import React, { useState, useRef, useEffect } from "react";
import classes from './Сompany.module.css';
import Filter from "../Filter/Filter";
import CreateRequestCompany from "../CreateRequestCompany/CreateRequestCompany";
import { requestsCompany } from "../../../requests";
import Header from "../Header/Header";
import InfoTableDataCompany from "../InfoTableDataCompany/InfoTableDataCompany";
import ExistRequestCompany from "../ExistRequestCompany/ExistRequestCompany";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import { useQuery } from "@apollo/client";
import { GET_DISPATCHERS } from "../../../../graphQL_requests";

function Company({ children, ...props }) {
    const { loading, error, data } = useQuery(GET_DISPATCHERS);

    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [chooseObject, setChooseObject] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);

    const deleteComponentRef = useRef();

    const [companyData, setCompanyData] = useState([]);

    useEffect(() => {
        if (data) {
            setCompanyData(data.dispatcherUsers)
        }
    }, [data]);

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
            (filterData.filterSelect === '' || request.role.includes(filterData.filterSelect)) &&
            (
                request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.role.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Модератор', 'Администратор'];

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
                        style={{ width: '500px' }}
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

                <InfoTableDataCompany
                    toggleRequestSidebar={toggleRequestSidebar}
                    requests={filteredRequests}
                    setChooseObject={setChooseObject}
                />

                <CreateRequestCompany
                    show={showCreateSidebar}
                    onClose={toggleCreateSidebar}
                    addDispatcher={addDispatcher}
                />

                <ExistRequestCompany
                    show={showRequestSidebar}
                    onClose={toggleRequestSidebar}
                    chooseObject={chooseObject}
                    updateDispatcher={updateDispatcher}
                    openDeleteComponent={openDeleteComponent}
                    deleteComponentRef={deleteComponentRef}
                    filterList={filterList}
                />

                {showDelete && (
                    <DeleteComponent
                        ref={deleteComponentRef}
                        remove={() => deleteDispatcher(deleteIndex)}
                        close={closeDeleteComponent}
                        title={`Вы действительно хотите удалить диспетчера?`}
                    />
                )}
            </div>
        </>
    );
}

export default Company;
