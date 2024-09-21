import React, { useState, useRef } from "react";
import classes from './HotelCompany_tabComponent.module.css';
import Filter from "../Filter/Filter";
import { requestsCompanyHotel } from "../../../requests";
import InfoTableDataCompany from "../InfoTableDataCompany/InfoTableDataCompany";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import CreateRequestCompanyHotel from "../CreateRequestCompanyHotel/CreateRequestCompanyHotel";
import ExistRequestCompanyHotel from "../ExistRequestCompanyHotel/ExistRequestCompanyHotel";

function HotelCompany_tabComponent({ children, id, ...props }) {
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [chooseObject, setChooseObject] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);

    const deleteComponentRef = useRef();

    const [companyData, setCompanyData] = useState(requestsCompanyHotel);

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
        setShowRequestSidebar(false);
    };

    const closeDeleteComponent = () => {
        setShowDelete(false);
        setShowRequestSidebar(true);
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

    let filterList = ['Модератор', 'Администратор'];

    return (
        <>
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
                    buttonTitle={'Добавить пользователя'}
                    filterList={filterList}
                    needDate={false}
                />
            </div>

            <InfoTableDataCompany
                id={id}
                toggleRequestSidebar={toggleRequestSidebar}
                requests={filteredRequests}
                setChooseObject={setChooseObject}
            />

            <CreateRequestCompanyHotel
                id={id}
                show={showCreateSidebar}
                onClose={toggleCreateSidebar}
                addDispatcher={addDispatcher}
            />

            <ExistRequestCompanyHotel
                id={id}
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
                    title={`Вы действительно хотите удалить пользователя?`}
                />
            )}
        </>
    );
}

export default HotelCompany_tabComponent;
