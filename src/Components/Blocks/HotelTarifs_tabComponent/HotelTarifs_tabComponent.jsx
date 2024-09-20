import React, { useEffect, useRef, useState } from "react";
import classes from './HotelTarifs_tabComponent.module.css';
import CreateRequestTarif from "../CreateRequestTarif/CreateRequestTarif";
import CreateRequestTarifCategory from "../CreateRequestTarifCategory/CreateRequestTarifCategory";
import InfoTableDataTarifs from "../InfoTableDataTarifs/InfoTableDataTarifs";
import EditRequestTarif from "../EditRequestTarif/EditRequestTarif";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";

import { requestsTarifs } from "../../../requests";

import { GET_HOTEL_TARIFS } from '../../../../graphQL_requests.js';
import { useQuery } from "@apollo/client";

import EditRequestTarifCategory from "../EditRequestTarifCategory/EditRequestTarifCategory";

function HotelTarifs_tabComponent({ children, id, ...props }) {
    const { loading, error, data } = useQuery(GET_HOTEL_TARIFS, {
        variables: { hotelId: id },
    });

    const [addTarif, setAddTarif] = useState([]);
    const [showAddTarif, setShowAddTarif] = useState(false);
    const [showAddTarifCategory, setShowAddTarifCategory] = useState(false);
    const [showEditAddTarif, setEditShowAddTarif] = useState(false);
    const [showEditAddTarifCategory, setEditShowAddTarifCategory] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [searchTarif, setSearchTarif] = useState('');

    useEffect(() => {
        if (data) {
            setAddTarif(data.hotel.tariffs);
        }
    }, [data]);

    const handleSearchTarif = (e) => {
        setSearchTarif(e.target.value);
    }

    const deleteComponentRef = useRef();

    const toggleTarifs = () => {
        setShowAddTarif(!showAddTarif)
    }

    const toggleTarifsCategory = () => {
        setShowAddTarifCategory(!showAddTarifCategory)
    }

    const toggleEditTarifs = (tarif) => {
        setSelectedTarif(tarif);
        setEditShowAddTarif(true);
    }

    const toggleEditTarifsCategory = (category, tarif) => {
        setSelectedTarif(
            {
                data: {
                    category,
                    tarif
                }
            }
        );
        setEditShowAddTarifCategory(true);
    }

    const handleEditTarif = (updatedTarif) => {
        const updatedTarifs = addTarif.map(tarif =>
            tarif === selectedTarif ? updatedTarif : tarif
        );
        setAddTarif(updatedTarifs);
        setEditShowAddTarif(false);
        setSelectedTarif(null);
    }

    const handleEditTarifCategory = (updatedCategory) => {
        const { tarif: currentTarif, category: currentCategory } = selectedTarif.data;
        const newTarifName = updatedCategory.tarifName;

        let updatedTarifs = addTarif.map(tarif => {
            if (tarif.tarifName === currentTarif && currentTarif === newTarifName) {
                const updatedCategories = tarif.categories.map(category => {
                    if (category.type === currentCategory.type &&
                        category.price === currentCategory.price &&
                        category.price_airline === currentCategory.price_airline) {
                        return { ...updatedCategory.categories };
                    }
                    return { ...category };
                });
                return {
                    ...tarif,
                    categories: [...updatedCategories]
                };
            }

            if (tarif.tarifName === currentTarif) {
                const updatedCategories = tarif.categories.filter(category =>
                    !(category.type === currentCategory.type &&
                        category.price === currentCategory.price &&
                        category.price_airline === currentCategory.price_airline)
                );
                return {
                    ...tarif,
                    categories: [...updatedCategories]
                };
            }
            return { ...tarif };
        });

        if (currentTarif !== newTarifName) {
            let newTarifFound = false;
            updatedTarifs = updatedTarifs.map(tarif => {
                if (tarif.tarifName === newTarifName) {
                    newTarifFound = true;
                    return {
                        ...tarif,
                        categories: [...tarif.categories, { ...updatedCategory.categories }]
                    };
                }
                return { ...tarif };
            });

            if (!newTarifFound) {
                const newTarif = {
                    tarifName: newTarifName,
                    categories: [{ ...updatedCategory.categories }],
                };
                updatedTarifs = [...updatedTarifs, newTarif];
            }
        }

        setAddTarif(updatedTarifs);
        setEditShowAddTarifCategory(false);
        setSelectedTarif(null);
    };



    const deleteTarif = (index) => {
        setAddTarif(addTarif.filter((_, i) => i !== index));
        setShowDelete(false);
        setEditShowAddTarif(false);
    };

    const openDeleteComponent = (index) => {
        setShowDelete(true);
        setDeleteIndex(index);
        setEditShowAddTarif(false);
    };

    const closeDeleteComponent = () => {
        setShowDelete(false);
        // setEditShowAddTarif(true);
    };

    const openDeleteComponentCategory = (category, tarif) => {
        setShowDelete(true);
        setDeleteIndex({
            data: {
                category,
                tarif
            }
        });
    };

    const deleteTarifCategory = (category, tarif) => {
        const updatedTarifs = addTarif.map(t => {
            if (t.tarifName == tarif) {
                const updatedCategories = t.categories.filter(cat => cat.type !== category.type);
                return {
                    tarifName: tarif,
                    categories: updatedCategories
                }
            }
            return t;
        });

        setAddTarif(updatedTarifs);
        setShowDelete(false);
        setEditShowAddTarif(false);
    };


    const filteredRequestsTarif = addTarif.filter(request => {
        return (
            request.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
            request.tarif_сategory_one_place.toLowerCase().includes(searchTarif.toLowerCase()) ||
            request.tarif_airline_one_place.toLowerCase().includes(searchTarif.toLowerCase()) ||
            request.tarif_сategory_two_place.toLowerCase().includes(searchTarif.toLowerCase()) ||
            request.tarif_airline_two_place.toLowerCase().includes(searchTarif.toLowerCase()) ||
            request.tarif_сategory_three_place.toLowerCase().includes(searchTarif.toLowerCase()) ||
            request.tarif_airline_three_place.toLowerCase().includes(searchTarif.toLowerCase())
        );
    });
    return (
        <>
            <div className={classes.section_searchAndFilter}>
                <input
                    type="text"
                    placeholder="Поиск по тарифам"
                    style={{ 'width': '500px' }}
                    value={searchTarif}
                    onChange={handleSearchTarif}
                />
                <div className={classes.section_searchAndFilter_filter}>
                    <Filter
                        toggleSidebar={toggleTarifs}
                        handleChange={''}
                        buttonTitle={'Добавить тариф'}
                    />
                    <Filter
                        toggleSidebar={toggleTarifsCategory}
                        handleChange={''}
                        buttonTitle={'Добавить категорию'}
                    />
                </div>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && data && (
                <InfoTableDataTarifs
                    toggleRequestSidebar={toggleEditTarifs}
                    toggleEditTarifsCategory={toggleEditTarifsCategory}
                    requests={filteredRequestsTarif}
                    openDeleteComponent={openDeleteComponent}
                    openDeleteComponentCategory={openDeleteComponentCategory}
                />
            )}

            <CreateRequestTarif id={id} show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} />
            <CreateRequestTarifCategory id={id} show={showAddTarifCategory} onClose={toggleTarifsCategory} addTarif={addTarif} setAddTarif={setAddTarif} />

            <EditRequestTarif show={showEditAddTarif} onClose={() => setEditShowAddTarif(false)} tarif={selectedTarif} onSubmit={handleEditTarif} />
            <EditRequestTarifCategory show={showEditAddTarifCategory} onClose={() => setEditShowAddTarifCategory(false)} addTarif={addTarif} tarif={selectedTarif} onSubmit={handleEditTarifCategory} />

            {showDelete && (
                <DeleteComponent
                    ref={deleteComponentRef}
                    remove={() => !deleteIndex.data ? deleteTarif(deleteIndex) : deleteTarifCategory(deleteIndex.data.category, deleteIndex.data.tarif)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить тариф?`}
                />
            )}
        </>
    );
}

export default HotelTarifs_tabComponent;