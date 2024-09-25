import React, { useEffect, useRef, useState } from "react";
import classes from './AirlineCompany_tabComponent.module.css';
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import Filter from "../Filter/Filter";

import { requestsAirlinesCompany } from "../../../requests";
import CreateRequestAirlineCompany from "../CreateRequestAirlineCompany/CreateRequestAirlineCompany";
import EditRequestAirlineOtdel from "../EditRequestAirlineOtdel/EditRequestAirlineOtdel";
import EditRequestAirlineCompany from "../EditRequestAirlineCompany/EditRequestAirlineCompany";
import InfoTableDataAirlineCompany from "../InfoTableDataAirlineCompany/InfoTableDataAirlineCompany";
import CreateRequestAirlineOtdel from "../CreateRequestAirlineOtdel/CreateRequestAirlineOtdel";
import { decodeJWT, GET_AIRLINE_COMPANY, getCookie } from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";

function AirlineCompany_tabComponent({ children, id, ...props }) {
    const [userRole, setUserRole] = useState();
    const token = getCookie('token');

    useEffect(() => {
        setUserRole(decodeJWT(token).role);
    }, [token]);

    const { loading, error, data } = useQuery(GET_AIRLINE_COMPANY, {
        variables: { airlineId: id },
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
        // const sortedTarifs = requestsAirlinesCompany.map(tarif => ({
        //     ...tarif,
        //     numbers: tarif.numbers.sort((a, b) => {
        //         return a.fio.localeCompare(b.fio);
        //     })
        // })).sort((a, b) => a.type.localeCompare(b.type));

        if (data) {
            setAddTarif(data.airline.department);
        }
    }, [data]);

    console.log(addTarif)

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

    const handleEditNomer = (updatedNomer) => {
        const updatedTarifs = addTarif.map(tarif => {
            if (tarif.type === selectedNomer.category && tarif.type === updatedNomer.category) {
                return {
                    ...tarif,
                    numbers: tarif.numbers.map(n => n.login === selectedNomer.nomer.login ? updatedNomer : n)
                };
            }

            if (tarif.type === selectedNomer.category) {
                return {
                    ...tarif,
                    numbers: tarif.numbers.filter(n => n.login !== selectedNomer.nomer.login)
                };
            }

            if (tarif.type === updatedNomer.category) {
                return {
                    ...tarif,
                    numbers: [...tarif.numbers, updatedNomer].sort((a, b) => a.fio.localeCompare(b.fio))
                };
            }

            return tarif;
        });

        if (!updatedTarifs.some(tarif => tarif.type === updatedNomer.category)) {
            updatedTarifs.push({
                type: updatedNomer.category,
                numbers: [updatedNomer]
            });
        }

        setAddTarif(updatedTarifs);
        setShowEditNomer(false);
        setSelectedNomer({});
    };



    // const uniqueCategories = Array.from(new Set(addTarif.map(request => request.type)));

    const filteredRequestsTarif = addTarif.filter(request => {
        const matchesCategory = selectQuery === '' || request.name.toLowerCase().includes(selectQuery.toLowerCase());

        const matchesSearch = searchTarif === '' ||
            request.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
            request.department.some(number =>
                number.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
                number.role.toLowerCase().includes(searchTarif.toLowerCase())
            );

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
                        buttonTitle={'Добавить отдел'}
                    />
                </div>
            </div>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}

            {!loading && !error && (
                <InfoTableDataAirlineCompany
                    toggleRequestSidebar={toggleEditCategory}
                    toggleRequestEditNumber={toggleEditNomer}
                    requests={filteredRequestsTarif}
                    openDeleteComponent={openDeleteComponent}
                    openDeleteNomerComponent={openDeleteNomerComponent}
                />
            )}

            <CreateRequestAirlineCompany show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif}  />
            <CreateRequestAirlineOtdel show={showAddCategory} onClose={toggleCategory} addTarif={addTarif} setAddTarif={setAddTarif}  />

            <EditRequestAirlineCompany
                show={showEditNomer}
                onClose={() => setShowEditNomer(false)}
                nomer={selectedNomer.nomer}
                category={selectedNomer.category}
                onSubmit={handleEditNomer}
                // uniqueCategories={uniqueCategories}
            />
            <EditRequestAirlineOtdel show={showEditCategory} onClose={() => setShowEditCategory(false)} category={selectedCategory} onSubmit={handleEditCategory} />

            {showDelete && (
                <DeleteComponent
                    ref={deleteComponentRef}
                    remove={deleteNomer ? deleteNomerFromCategory : () => deleteTarif(deleteIndex)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить ${deleteNomer ? 'менеджера' : 'отдел'}?`}
                />
            )}
        </>
    );
}

export default AirlineCompany_tabComponent;