import React, { useEffect, useRef, useState } from "react";
import classes from './HotelNomerFond_tabComponent.module.css';
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";

import { requestsNomerFond, requestsTarifs } from "../../../requests";
import InfoTableDataNomerFond from "../InfoTableDataNomerFond/InfoTableDataNomerFond";
import CreateRequestNomerFond from "../CreateRequestNomerFond/CreateRequestNomerFond";
import CreateRequestCategoryNomer from "../CreateRequestCategoryNomer/CreateRequestCategoryNomer";
import EditRequestCategory from "../EditRequestCategory/EditRequestCategory";
import EditRequestNomerFond from "../EditRequestNomerFond/EditRequestNomerFond";

import { getCookie, GET_HOTEL_ROOMS, DELETE_HOTEL_ROOM, DELETE_HOTEL_CATEGORY } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";


function HotelNomerFond_tabComponent({ children, id, ...props }) {
    const token = getCookie('token');

    const { loading, error, data } = useQuery(GET_HOTEL_ROOMS, {
        variables: { hotelId: id },
    });

    const [addTarif, setAddTarif] = useState([]);
    const [showAddTarif, setShowAddTarif] = useState(false);
    const [showAddCategory, setshowAddCategory] = useState(false);

    const [showDelete, setShowDelete] = useState(false);

    const [deleteIndex, setDeleteIndex] = useState(null);
    const [deleteNomer, setDeleteNomer] = useState(null);

    const [searchTarif, setSearchTarif] = useState('');
    const [selectQuery, setSelectQuery] = useState('');
    const [showEditCategory, setShowEditCategory] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [showEditNomer, setShowEditNomer] = useState(false);
    const [selectedNomer, setSelectedNomer] = useState({});

    const [deleteHotelRoom] = useMutation(DELETE_HOTEL_ROOM, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });
    const [deleteHotelCategory] = useMutation(DELETE_HOTEL_CATEGORY, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    useEffect(() => {
        if (data) {
            const sortedTarifs = data.hotel.categories.map(tarif => ({
                ...tarif,
                rooms: [...tarif.rooms].sort((a, b) => a.name.localeCompare(b.name))
            })).sort((a, b) => a.name.localeCompare(b.name));

            setAddTarif(sortedTarifs);
        }
    }, [data]);


    const handleSearchTarif = (e) => {
        setSearchTarif(e.target.value);
    }

    const handleSelect = (e) => {
        setSelectQuery(e.target.value);
    }

    const deleteComponentRef = useRef();

    const toggleTarifs = () => {
        setShowAddTarif(!showAddTarif)
    }

    const toggleCategory = () => {
        setshowAddCategory(!showAddCategory)
    }

    const toggleEditCategory = (category) => {
        setSelectedCategory(category);
        setShowEditCategory(true);
    }

    const handleEditCategory = (updatedCategory) => {
        const updatedTarifs = addTarif.map(tarif =>
            tarif.name === selectedCategory.name
                ?
                { ...tarif, name: updatedCategory.type }
                :
                tarif
        ).sort((a, b) => a.name.localeCompare(b.name));

        setAddTarif(updatedTarifs);
        setShowEditCategory(false);
        setSelectedCategory(null);
    }

    const deleteTarif = async (item) => {
        let response_update_category = await deleteHotelCategory({
            variables: {
                "deleteCategoryId": item.item.id
            }
        });
        if (response_update_category) {
            setAddTarif(addTarif.filter((_, i) => i !== item.index));
            setShowDelete(false);
            setShowEditCategory(false);
        }
    };

    const openDeleteNomerComponent = (nomer, category) => {
        setDeleteNomer({ nomer, category, type: 'deleteRoom' });
        setShowDelete(true);
    };

    const deleteNomerFromCategory = async (roomInfo) => {
        let response_update_room = await deleteHotelRoom({
            variables: {
                "deleteRoomId": roomInfo.nomer.id
            }
        });

        if (response_update_room) {
            setAddTarif(prevTarifs => prevTarifs.map(tarif => {
                if (tarif.name === deleteNomer.category) {
                    const updatedNumbers = tarif.rooms.filter(num => num.name !== deleteNomer.nomer.name);
                    return { ...tarif, rooms: updatedNumbers };
                }
                return tarif;
            }));
            setShowDelete(false);
            setDeleteNomer(null);
        }
    };

    const openDeleteComponent = (index, item) => {
        setShowDelete(true);
        setDeleteIndex({ index, item });
        setShowEditCategory(false);
    };


    const closeDeleteComponent = () => {
        setShowDelete(false);
        setShowEditCategory(false);
    };

    const toggleEditNomer = (nomer, category) => {
        setSelectedNomer({ nomer, category });
        setShowEditNomer(true);
    }

    const handleEditNomer = (updatedNomer, oldNomer, newCategory) => {
        setShowEditNomer(false);
        setSelectedNomer({});
    };

    const uniqueCategories = addTarif && addTarif.map(request => `${request.name} - ${request.tariffs.name}`);

    const filteredRequestsTarif = addTarif.filter(request => {
        const matchesCategory = selectQuery === '' || (selectQuery.toLowerCase().includes(request.name.toLowerCase()) && selectQuery.toLowerCase().includes(request.tariffs.name.toLowerCase()));
        const matchesSearch = searchTarif === '' || request.rooms.some(room => room.name.toLowerCase().includes(searchTarif.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && addTarif && (
                <>
                    <div className={classes.section_searchAndFilter}>
                        <input
                            type="text"
                            placeholder="Поиск по номеру"
                            style={{ 'width': '500px' }}
                            value={searchTarif}
                            onChange={handleSearchTarif}
                        />
                        <div className={classes.section_searchAndFilter_filter}>
                            <select onChange={handleSelect}>
                                <option value="">Показать все</option>
                                {uniqueCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <Filter
                                toggleSidebar={toggleTarifs}
                                handleChange={''}
                                buttonTitle={'Добавить номер'}
                            />
                            {/* <Filter
                                toggleSidebar={toggleCategory}
                                handleChange={''}
                                buttonTitle={'Добавить Категорию'}
                            /> */}
                        </div>
                    </div>

                    <InfoTableDataNomerFond
                        toggleRequestSidebar={toggleEditCategory}
                        toggleRequestEditNumber={toggleEditNomer}
                        requests={filteredRequestsTarif}
                        openDeleteComponent={openDeleteComponent}
                        openDeleteNomerComponent={openDeleteNomerComponent}
                    />

                    <CreateRequestNomerFond id={id} tarifs={requestsTarifs} show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} uniqueCategories={uniqueCategories} />
                    {/* <CreateRequestCategoryNomer id={id} show={showAddCategory} onClose={toggleCategory} addTarif={addTarif} setAddTarif={setAddTarif} uniqueCategories={uniqueCategories} /> */}

                    <EditRequestNomerFond
                        id={id}
                        tarifs={requestsTarifs}
                        show={showEditNomer}
                        onClose={() => setShowEditNomer(false)}
                        nomer={selectedNomer.nomer}
                        category={selectedNomer.category}
                        selectedNomer={selectedNomer}
                        onSubmit={handleEditNomer}
                        uniqueCategories={uniqueCategories}
                        addTarif={addTarif}
                        setAddTarif={setAddTarif}
                    />
                    <EditRequestCategory id={id} show={showEditCategory} onClose={() => setShowEditCategory(false)} category={selectedCategory} onSubmit={handleEditCategory} />

                    {showDelete && (
                        <DeleteComponent
                            ref={deleteComponentRef}
                            remove={deleteNomer ? () => deleteNomerFromCategory(deleteNomer) : () => deleteTarif(deleteIndex)}
                            close={closeDeleteComponent}
                            title={`Вы действительно хотите удалить ${deleteNomer ? 'номер' : 'категорию'}?`}
                        />
                    )}
                </>
            )}
        </>
    );
}

export default HotelNomerFond_tabComponent;