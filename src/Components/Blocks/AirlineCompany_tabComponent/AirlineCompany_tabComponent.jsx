import React, { useEffect, useRef, useState } from "react";
import classes from './AirlineCompany_tabComponent.module.css';
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";

import { requestsAirlinesCompany } from "../../../requests";
import CreateRequestNomerFond from "../CreateRequestNomerFond/CreateRequestNomerFond";
import CreateRequestCategoryNomer from "../CreateRequestCategoryNomer/CreateRequestCategoryNomer";
import EditRequestCategory from "../EditRequestCategory/EditRequestCategory";
import EditRequestNomerFond from "../EditRequestNomerFond/EditRequestNomerFond";
import InfoTableDataAirlineCompany from "../InfoTableDataAirlineCompany/InfoTableDataAirlineCompany";

function AirlineCompany_tabComponent({ children, ...props }) {
    const [addTarif, setAddTarif] = useState([]);
    const [showAddTarif, setShowAddTarif] = useState(false);
    const [showAddCategory, setshowAddCategory] = useState(false);

    const [showDelete, setShowDelete] = useState(false);

    const [deleteIndex, setDeleteIndex] = useState(null);
    const [deleteNomer, setDeleteNomer] = useState(null);

    const [searchTarif, setSearchTarif] = useState('');
    const [selectQuery, setSelectQuery] = useState('');
    const [showEditCategory, setShowEditCategory] = useState(false); // Новый стейт для редактирования категории
    const [selectedCategory, setSelectedCategory] = useState(null); // Стейт для хранения выбранной категории

    const [showEditNomer, setShowEditNomer] = useState(false);
    const [selectedNomer, setSelectedNomer] = useState({});

    useEffect(() => {
        const sortedTarifs = requestsAirlinesCompany.map(tarif => ({
            ...tarif,
            numbers: tarif.numbers.sort((a, b) => {
                // Сортировка по ФИО (fio) сотрудников
                return a.fio.localeCompare(b.fio);
            })
        })).sort((a, b) => a.type.localeCompare(b.type)); // Сортировка по названию отдела (type)
    
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

    const openDeleteNomerComponent = (nomer, category) => {
        setDeleteNomer({ nomer, category });
        setShowDelete(true);
    };

    const deleteNomerFromCategory = () => {
        setAddTarif(prevTarifs => prevTarifs.map(tarif => {
            if (tarif.type === deleteNomer.category) {
                const updatedNumbers = tarif.numbers.filter(num => num !== deleteNomer.nomer);
                return { ...tarif, numbers: updatedNumbers };
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
        setShowEditCategory(true);
    };

    const toggleEditNomer = (nomer, category) => {
        setSelectedNomer({ nomer, category });
        setShowEditNomer(true);
    }

    const handleEditNomer = (updatedNomer, oldNomer, newCategory) => {
        const updatedTarifs = addTarif.map(tarif => {
            if (tarif.type === selectedNomer.category) {
                const updatedNumbers = tarif.numbers.filter(n => n !== oldNomer);
    
                if (newCategory === selectedNomer.category) {
                    updatedNumbers.push(updatedNomer);
                    updatedNumbers.sort((a, b) => {
                        const numA = parseInt(a.replace(/^\D+/g, ''));
                        const numB = parseInt(b.replace(/^\D+/g, ''));
                        return numA - numB;
                    });
                    return { ...tarif, numbers: updatedNumbers };
                }
    
                return { ...tarif, numbers: updatedNumbers };
            }
    
            if (tarif.type === newCategory) {
                const updatedNumbers = [...tarif.numbers, updatedNomer].sort((a, b) => {
                    const numA = parseInt(a.replace(/^\D+/g, ''));
                    const numB = parseInt(b.replace(/^\D+/g, ''));
                    return numA - numB;
                });
                return { ...tarif, numbers: updatedNumbers };
            }
    
            return tarif;
        });
    
        setAddTarif(updatedTarifs);
        setShowEditNomer(false);
        setSelectedNomer({});
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
                    <Filter
                        toggleSidebar={toggleTarifs}
                        handleChange={''}
                        buttonTitle={'Добавить аккаунт менеджера'}
                    />
                    <Filter
                        toggleSidebar={toggleCategory}
                        handleChange={''}
                        buttonTitle={'Добавить подразделение'}
                    />
                </div>
            </div>

            <InfoTableDataAirlineCompany
                toggleRequestSidebar={toggleEditCategory}
                toggleRequestEditNumber={toggleEditNomer}
                requests={filteredRequestsTarif}
                openDeleteComponent={openDeleteComponent}
                openDeleteNomerComponent={openDeleteNomerComponent}
            />

            <CreateRequestNomerFond show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} uniqueCategories={uniqueCategories} />
            <CreateRequestCategoryNomer show={showAddCategory} onClose={toggleCategory} addTarif={addTarif} setAddTarif={setAddTarif} uniqueCategories={uniqueCategories} />

            <EditRequestNomerFond
                show={showEditNomer}
                onClose={() => setShowEditNomer(false)}
                nomer={selectedNomer.nomer}
                category={selectedNomer.category}
                onSubmit={handleEditNomer}
                uniqueCategories={uniqueCategories}
            />
            <EditRequestCategory show={showEditCategory} onClose={() => setShowEditCategory(false)} category={selectedCategory} onSubmit={handleEditCategory} />

            {showDelete && (
                <DeleteComponent
                    ref={deleteComponentRef}
                    remove={deleteNomer ? deleteNomerFromCategory : () => deleteTarif(deleteIndex)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить ${deleteNomer ? 'номер' : 'категорию'}?`}
                />
            )}
        </>
    );
}

export default AirlineCompany_tabComponent;