import React, { useState, useRef, useEffect } from "react";
import classes from './HotelCompany_tabComponent.module.css';
import Filter from "../Filter/Filter";
import { requestsCompanyHotel } from "../../../requests";
import InfoTableDataCompany from "../InfoTableDataCompany/InfoTableDataCompany";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import CreateRequestCompanyHotel from "../CreateRequestCompanyHotel/CreateRequestCompanyHotel";
import ExistRequestCompanyHotel from "../ExistRequestCompanyHotel/ExistRequestCompanyHotel";

import { GET_HOTEL_USERS, DELETE_HOTEL_USER } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

function HotelCompany_tabComponent({ children, id, ...props }) {
    const { loading, error, data } = useQuery(GET_HOTEL_USERS, {
        variables: { hotelId: id },
    });

    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showRequestSidebar, setShowRequestSidebar] = useState(false);
    const [chooseObject, setChooseObject] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);

    const deleteComponentRef = useRef();

    const [companyData, setCompanyData] = useState([]);

    useEffect(() => {
        if (data) {
            setCompanyData(data.hotelUsers);
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

    const [deleteHotelUser] = useMutation(DELETE_HOTEL_USER, {
        context: {
            headers: {
                Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NmVjMDFhNjk4MjEyNmU5YjlkOTNjOWIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MjcwODk3NTJ9.gJRYhTLk1osyD_gdOUURx5eraGUrNltfH1SCyJynSgA`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const deleteDispatcher = async (index, userID) => {
        let response_delete_user = await deleteHotelUser({
            variables: {
                "deleteUserId": userID
            }
        });
        if (response_delete_user) {
            setCompanyData(companyData.filter((_, i) => i !== index));
            setShowDelete(false);
            setShowRequestSidebar(false);
        }
    };

    const toggleCreateSidebar = () => {
        setShowCreateSidebar(!showCreateSidebar);
    };

    const toggleRequestSidebar = () => {
        setShowRequestSidebar(!showRequestSidebar);
    };


    const openDeleteComponent = async (index, userID) => {
        setShowDelete(true);
        setDeleteIndex({index, userID});
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
            (filterData.filterSelect === '' || request.role.includes(filterData.filterSelect)) &&
            (
                request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.role.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    });

    let filterList = ['Модератор', 'Администратор', 'Пользователь'];
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

            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && (
                <InfoTableDataCompany
                    id={id}
                    toggleRequestSidebar={toggleRequestSidebar}
                    requests={filteredRequests}
                    setChooseObject={setChooseObject}
                />
            )}

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
                    remove={() => deleteDispatcher(deleteIndex.index, deleteIndex.userID)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить пользователя?`}
                />
            )}
        </>
    );
}

export default HotelCompany_tabComponent;
