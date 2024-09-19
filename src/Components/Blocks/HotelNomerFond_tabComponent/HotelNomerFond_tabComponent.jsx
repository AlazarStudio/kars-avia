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

import { GET_HOTEL_ROOMS } from '../../../../graphQL_requests.js';
import { useQuery } from "@apollo/client";


function HotelNomerFond_tabComponent({ children, id, ...props }) {
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

    const deleteTarif = (index) => {
        setAddTarif(addTarif.filter((_, i) => i !== index));
        setShowDelete(false);
        setShowEditCategory(false);
    };

    const openDeleteNomerComponent = (nomer, category) => {
        setDeleteNomer({ nomer, category });
        setShowDelete(true);
    };

    const deleteNomerFromCategory = () => {
        setAddTarif(prevTarifs => prevTarifs.map(tarif => {
            if (tarif.name === deleteNomer.category) {
                const updatedNumbers = tarif.rooms.filter(num => num.name !== deleteNomer.nomer.name);
                return { ...tarif, rooms: updatedNumbers };
            }
            return tarif;
        }));
        setShowDelete(false);
        setDeleteNomer(null);
    };

    const openDeleteComponent = (index) => {
        setShowDelete(true);
        setDeleteIndex(index);
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
        console.log(selectedNomer)
        const updatedTarifs = addTarif.map(tarif => {
            if (tarif.name === selectedNomer.category) {
                const updatedNumbers = tarif.rooms.filter(n => n !== oldNomer);

                if (newCategory === selectedNomer.category) {
                    updatedNumbers.push({ name: updatedNomer });
                    updatedNumbers.sort((a, b) => a.name.localeCompare(b.name));
                    return { ...tarif, rooms: updatedNumbers };
                }

                return { ...tarif, rooms: updatedNumbers };
            }

            if (tarif.name === newCategory) {
                const updatedNumbers = [...tarif.rooms, { name: updatedNomer }];
                return { ...tarif, rooms: updatedNumbers };
            }

            return tarif;
        });

        setAddTarif(updatedTarifs);
        setShowEditNomer(false);
        setSelectedNomer({});
    };

    const uniqueCategories = Array.from(new Set(addTarif.map(request => request.name)));

    const filteredRequestsTarif = addTarif.filter(request => {
        const matchesCategory = selectQuery === '' || request.name === selectQuery;
        const matchesSearch = searchTarif === '' || request.rooms.some(room => room.name.toLowerCase().includes(searchTarif.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && (
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
                    <CreateRequestCategoryNomer id={id} show={showAddCategory} onClose={toggleCategory} addTarif={addTarif} setAddTarif={setAddTarif} uniqueCategories={uniqueCategories} />

                    <EditRequestNomerFond
                        id={id} 
                        tarifs={requestsTarifs}
                        show={showEditNomer}
                        onClose={() => setShowEditNomer(false)}
                        nomer={selectedNomer.nomer}
                        category={selectedNomer.category}
                        onSubmit={handleEditNomer}
                        uniqueCategories={uniqueCategories}
                        addTarif={addTarif}
                    />
                    <EditRequestCategory id={id} show={showEditCategory} onClose={() => setShowEditCategory(false)} category={selectedCategory} onSubmit={handleEditCategory} />

                    {showDelete && (
                        <DeleteComponent
                            ref={deleteComponentRef}
                            remove={deleteNomer ? deleteNomerFromCategory : () => deleteTarif(deleteIndex)}
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