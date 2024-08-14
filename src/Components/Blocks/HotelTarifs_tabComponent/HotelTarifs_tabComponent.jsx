import React, { useRef, useState } from "react";
import classes from './HotelTarifs_tabComponent.module.css';
import CreateRequestTarif from "../CreateRequestTarif/CreateRequestTarif";
import InfoTableDataTarifs from "../InfoTableDataTarifs/InfoTableDataTarifs";
import EditRequestTarif from "../EditRequestTarif/EditRequestTarif";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";

import { requestsTarifs } from "../../../requests";

function HotelTarifs_tabComponent({ children, ...props }) {

    const [addTarif, setAddTarif] = useState(requestsTarifs);
    const [showAddTarif, setShowAddTarif] = useState(false);
    const [showEditAddTarif, setEditShowAddTarif] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [searchTarif, setSearchTarif] = useState('');

    const handleSearchTarif = (e) => {
        setSearchTarif(e.target.value);
    }

    const deleteComponentRef = useRef();

    const toggleTarifs = () => {
        setShowAddTarif(!showAddTarif)
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

    const filteredRequestsTarif = addTarif.filter(request => {
        return (
            request.tarifName.toLowerCase().includes(searchTarif.toLowerCase()) ||
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
                </div>
            </div>

            <InfoTableDataTarifs
                toggleRequestSidebar={toggleEditTarifs}
                requests={filteredRequestsTarif}
                openDeleteComponent={openDeleteComponent}
            />

            <CreateRequestTarif show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} />
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

export default HotelTarifs_tabComponent;