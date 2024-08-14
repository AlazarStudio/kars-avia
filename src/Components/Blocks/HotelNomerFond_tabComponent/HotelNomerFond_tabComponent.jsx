import React, { useEffect, useRef, useState } from "react";
import classes from './HotelNomerFond_tabComponent.module.css';
import EditRequestTarif from "../EditRequestTarif/EditRequestTarif";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";

import { requestsNomerFond } from "../../../requests";
import InfoTableDataNomerFond from "../InfoTableDataNomerFond/InfoTableDataNomerFond";
import CreateRequestNomerFond from "../CreateRequestNomerFond/CreateRequestNomerFond";
import CreateRequestCategoryNomer from "../CreateRequestCategoryNomer/CreateRequestCategoryNomer";

function HotelNomerFond_tabComponent({ children, ...props }) {
    const [addTarif, setAddTarif] = useState([]);
    const [showAddTarif, setShowAddTarif] = useState(false);
    const [showAddCategory, setshowAddCategory] = useState(false);
    const [showEditAddTarif, setEditShowAddTarif] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [searchTarif, setSearchTarif] = useState('');
    const [selectQuery, setSelectQuery] = useState('');

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

    const toggleEditTarifs = (tarif) => {
        setSelectedTarif(tarif);
        setEditShowAddTarif(true);
    }

    const handleEditTarif = (updatedTarif) => {
        const updatedTarifs = addTarif.map(tarif =>
            tarif === selectedTarif ? updatedTarif : tarif
        );
        setAddTarif(updatedTarifs);
        setEditShowAddTarif(false);
        setSelectedTarif(null);
    }

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
        setEditShowAddTarif(true);
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
                toggleRequestSidebar={toggleEditTarifs}
                requests={filteredRequestsTarif}
                openDeleteComponent={openDeleteComponent}
            />

            <CreateRequestNomerFond show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} uniqueCategories={uniqueCategories} />
            <CreateRequestCategoryNomer show={showAddCategory} onClose={toggleCategory} addTarif={addTarif} setAddTarif={setAddTarif} uniqueCategories={uniqueCategories} />
            <EditRequestTarif show={showEditAddTarif} onClose={() => setEditShowAddTarif(false)} tarif={selectedTarif} onSubmit={handleEditTarif} />

            {showDelete && (
                <DeleteComponent
                    ref={deleteComponentRef}
                    remove={() => deleteTarif(deleteIndex)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить тариф?`}
                />
            )}
        </>
    );
}

export default HotelNomerFond_tabComponent;