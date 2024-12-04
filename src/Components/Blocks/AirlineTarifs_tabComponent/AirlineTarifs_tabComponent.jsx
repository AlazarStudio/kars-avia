import React, { useEffect, useRef, useState } from "react";
import classes from './AirlineTarifs_tabComponent.module.css';
import CreateRequestTarif from "../CreateRequestTarif/CreateRequestTarif.jsx";
import CreateRequestTarifCategory from "../CreateRequestTarifCategory/CreateRequestTarifCategory.jsx";
import InfoTableDataTarifs from "../InfoTableDataTarifs/InfoTableDataTarifs.jsx";
import EditRequestTarif from "../EditRequestTarif/EditRequestTarif.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
import Filter from "../Filter/Filter.jsx";

import { requestsTarifs } from "../../../requests.js";

import { getCookie, GET_AIRLINE_TARIFS, GET_AIRLINE_MEAL_PRICE, DELETE_AIRLINE_CATEGORY, DELETE_AIRLINE_TARIFF } from '../../../../graphQL_requests.js';
import { useMutation, useQuery } from "@apollo/client";

import EditRequestTarifCategory from "../EditRequestTarifCategory/EditRequestTarifCategory.jsx";
import EditRequestMealTarif from "../EditRequestMealTarif/EditRequestMealTarif.jsx";

function AirlineTarifs_tabComponent({ children, id, user, ...props }) {
    const token = getCookie('token');
    

    const { loading, error, data } = useQuery(GET_AIRLINE_TARIFS, {
        variables: { airlineId: id },
    });

    const { loading: mealPriceLoading, error: mealPriceError, data: mealPriceData } = useQuery(GET_AIRLINE_MEAL_PRICE, {
        variables: {airlineId: id}
    });

    const [addTarif, setAddTarif] = useState([]);
    const [mealPrices, setMealPrices] = useState({
        breakfast: 0,
        lunch: 0,
        dinner: 0
    })
    const [showAddTarif, setShowAddTarif] = useState(false);
    const [showAddTarifCategory, setShowAddTarifCategory] = useState(false);
    const [showEditAddTarif, setEditShowAddTarif] = useState(false);
    const [showEditAddTarifCategory, setEditShowAddTarifCategory] = useState(false);
    const [showEditMealPrices, setShowEditMealPrices] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [searchTarif, setSearchTarif] = useState('');

    const [deleteHotelCategory] = useMutation(DELETE_AIRLINE_CATEGORY, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
    });
    const [deleteHotelTarif] = useMutation(DELETE_AIRLINE_TARIFF, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                // 'Apollo-Require-Preflight': 'true',
            },
        },
    });

    useEffect(() => {
        if (data) {
            setAddTarif([
                {
                    name: 'Одноместный',
                    price: data.airline.priceOneCategory,
                    type: 1
                },
                {
                    name: 'Двухместный',
                    price: data.airline.priceTwoCategory,
                    type: 2
                },
            ]);
        }
    }, [data]);



    useEffect(() => {
        if (mealPriceData) {
            setMealPrices({
                breakfast: mealPriceData.airline.MealPrice.breakfast,
                lunch: mealPriceData.airline.MealPrice.lunch,
                dinner: mealPriceData.airline.MealPrice.dinner
            })
        }
    }, [mealPriceData]);

    

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
        setAddTarif(updatedTarif);
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

    const deleteTarif = async (index, tarifID) => {
        let response_update_tarif = await deleteHotelTarif({
            variables: {
                "deleteTariffId": tarifID
            }
        });

        if (response_update_tarif) {
            setAddTarif(addTarif.filter((_, i) => i !== index));
            setShowDelete(false);
            setEditShowAddTarif(false);
        }
    };

    const openDeleteComponent = (index, tarifID) => {
        setShowDelete(true);
        setDeleteIndex({
            type: 'deleteTarif',
            data: {
                index,
                tarifID
            }
        });
        setEditShowAddTarif(false);
    };

    const closeDeleteComponent = () => {
        setShowDelete(false);
        // setEditShowAddTarif(true);
    };

    const openDeleteComponentCategory = (category, tarif) => {
        setShowDelete(true);
        setDeleteIndex({
            type: 'deleteCategory',
            data: {
                category,
                tarif
            }
        });
    };

    const deleteTarifCategory = async (category, tarif) => {
        let response_update_category = await deleteHotelCategory({
            variables: {
                "deleteCategoryId": category.id
            }
        });

        if (response_update_category) {
            const updatedTarifs = addTarif.map(t => {
                if (t.id == tarif.id) {
                    const updatedCategories = t.category.filter(cat => cat.id !== category.id);
                    return {
                        name: tarif.name,
                        category: updatedCategories
                    }
                }
                return t;
            });

            setAddTarif(updatedTarifs);
            setShowDelete(false);
            setEditShowAddTarif(false);
        }
    };

    const handleEditMealPrices = (updatedPrices) => {
        setMealPrices(updatedPrices);
        setShowEditMealPrices(false);
    };

    const toggleEditMealPrices = () => {
        setShowEditMealPrices(!showEditMealPrices);
    };

    const filteredRequestsTarif = addTarif.filter(request => {
        return (
            request.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
            String(request.price).toLowerCase().includes(searchTarif.toLowerCase())
        );
    });


    const filteredRequestsMealTarif = [
        { name: 'Завтрак', price: mealPrices.breakfast },
        { name: 'Обед', price: mealPrices.lunch },
        { name: 'Ужин', price: mealPrices.dinner }
    ];

    return (
        <>
            {/* <div className={classes.section_searchAndFilter}>
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
            </div> */}

            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && data && (
                <InfoTableDataTarifs
                    toggleRequestSidebar={toggleEditTarifs}
                    toggleEditTarifsCategory={toggleEditTarifsCategory}
                    toggleEditMealPrices={toggleEditMealPrices}
                    requests={filteredRequestsTarif}
                    mealPrices={filteredRequestsMealTarif}
                    openDeleteComponent={openDeleteComponent}
                    openDeleteComponentCategory={openDeleteComponentCategory}
                    user={user}
                />
            )}

            {/* <CreateRequestTarif id={id} show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} /> */}
            {/* <CreateRequestTarifCategory user={user} id={id} show={showAddTarifCategory} onClose={toggleTarifsCategory} addTarif={addTarif} setAddTarif={setAddTarif} /> */}

            <EditRequestTarif id={id} setAddTarif={setAddTarif} show={showEditAddTarif} onClose={() => setEditShowAddTarif(false)} tarif={selectedTarif} onSubmit={handleEditTarif} isHotel={false} />
            <EditRequestMealTarif id={id} show={showEditMealPrices} mealPrices={mealPrices} onClose={toggleEditMealPrices} onSubmit={handleEditMealPrices} isHotel={false} />
            {/* <EditRequestTarifCategory user={user} id={id} setAddTarif={setAddTarif} show={showEditAddTarifCategory} onClose={() => setEditShowAddTarifCategory(false)} addTarif={addTarif} tarif={selectedTarif} onSubmit={handleEditTarifCategory} /> */}

            {/* {showDelete && (
                <DeleteComponent
                    ref={deleteComponentRef}
                    remove={() => deleteIndex.type == "deleteTarif" ? deleteTarif(deleteIndex.data.index, deleteIndex.data.tarifID) : deleteTarifCategory(deleteIndex.data.category, deleteIndex.data.tarif)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить ${deleteIndex.type == "deleteTarif" ? 'тариф' : 'категорию'}?`}
                />
            )} */}
        </>
    );
}

export default AirlineTarifs_tabComponent;