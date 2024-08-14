import React, { useEffect, useRef, useState } from "react";
import classes from './HotelNomerFond_tabComponent.module.css';
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";

import { requestsNomerFond } from "../../../requests";
import InfoTableDataNomerFond from "../InfoTableDataNomerFond/InfoTableDataNomerFond";
import CreateRequestNomerFond from "../CreateRequestNomerFond/CreateRequestNomerFond";
import CreateRequestCategoryNomer from "../CreateRequestCategoryNomer/CreateRequestCategoryNomer";
import EditRequestCategory from "../EditRequestCategory/EditRequestCategory";

function HotelNomerFond_tabComponent({ children, ...props }) {
    const [addTarif, setAddTarif] = useState([]);
    const [showAddTarif, setShowAddTarif] = useState(false);
    const [showAddCategory, setshowAddCategory] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [searchTarif, setSearchTarif] = useState('');
    const [selectQuery, setSelectQuery] = useState('');
    const [showEditCategory, setShowEditCategory] = useState(false); // Новый стейт для редактирования категории
    const [selectedCategory, setSelectedCategory] = useState(null); // Стейт для хранения выбранной категории

    useEffect(() => {
        const sortedTarifs = requestsNomerFond.map(tarif => ({
            ...tarif,
            numbers: tarif.numbers.sort((a, b) => {
                const numA = parseInt(a.replace(/^\D+/g, ''));
                const numB = parseInt(b.replace(/^\D+/g, ''));
                return numA - numB;
            })
        })).sort((a, b) => parseInt(a.type) - parseInt(b.type));

        setAddTarif(sortedTarifs);
    }, []);

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
            tarif.type === selectedCategory.type ? { ...tarif, type: updatedCategory.type } : tarif
        ).sort((a, b) => parseInt(a.type) - parseInt(b.type));
        setAddTarif(updatedTarifs);
        setShowEditCategory(false);
        setSelectedCategory(null);
    }

    const deleteTarif = (index) => {
        setAddTarif(addTarif.filter((_, i) => i !== index));
        setShowDelete(false);
        setShowEditCategory(false);
    };

    const openDeleteComponent = (index) => {
        setShowDelete(true);
        setDeleteIndex(index);
        setShowEditCategory(false);
    };

    const closeDeleteComponent = () => {
        setShowDelete(false);
        setShowEditCategory(true);
    };

    const uniqueCategories = Array.from(new Set(addTarif.map(request => request.type)));

    const filteredRequestsTarif = addTarif.filter(request => {
        const matchesCategory = selectQuery === '' || request.type === selectQuery;
        const matchesSearch = searchTarif === '' || request.numbers.some(number => number.toLowerCase().includes(searchTarif.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
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
                            <option key={category} value={category}>{category} - местный</option>
                        ))}
                    </select>
                    <Filter
                        toggleSidebar={toggleTarifs}
                        handleChange={''}
                        buttonTitle={'Добавить номер'}
                    />
                    <Filter
                        toggleSidebar={toggleCategory}
                        handleChange={''}
                        buttonTitle={'Добавить Категорию'}
                    />
                </div>
            </div>

            <InfoTableDataNomerFond
                toggleRequestSidebar={toggleEditCategory}
                requests={filteredRequestsTarif}
                openDeleteComponent={openDeleteComponent}
            />

            <CreateRequestNomerFond show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} uniqueCategories={uniqueCategories} />
            <CreateRequestCategoryNomer show={showAddCategory} onClose={toggleCategory} addTarif={addTarif} setAddTarif={setAddTarif} uniqueCategories={uniqueCategories} />

            <EditRequestCategory show={showEditCategory} onClose={() => setShowEditCategory(false)} category={selectedCategory} onSubmit={handleEditCategory} />

            {showDelete && (
                <DeleteComponent
                    ref={deleteComponentRef}
                    remove={() => deleteTarif(deleteIndex)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить категорию?`}
                />
            )}
        </>
    );
}

export default HotelNomerFond_tabComponent;