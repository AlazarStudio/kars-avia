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
import { decodeJWT, DELETE_AIRLINE_DEPARTMENT, DELETE_AIRLINE_MANAGER, GET_AIRLINE_COMPANY, getCookie } from "../../../../graphQL_requests";
import { useMutation, useQuery } from "@apollo/client";

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
        if (data) {
            const sortedTarifs = data.airline.department.map(tarif => ({
                ...tarif,
                users: [...tarif.users].sort((a, b) => a.name.localeCompare(b.name))
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
        setAddTarif(updatedCategory);
        setShowEditCategory(false);
        setSelectedCategory(null);
    }

    const [deleteAirlineDepartment] = useMutation(DELETE_AIRLINE_DEPARTMENT, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const deleteTarif = async (index, id) => {
        try {
            let request = await deleteAirlineDepartment({
                variables: {
                    "deleteAirlineDepartmentId": id
                }
            });

            if (request) {
                setAddTarif(addTarif.filter((_, i) => i !== index));
                setShowDelete(false);
                setShowEditCategory(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openDeleteNomerComponent = (user, category) => {
        setDeleteNomer({ user, category });
        setShowDelete(true);
    };

    const [deleteAirlineManager] = useMutation(DELETE_AIRLINE_MANAGER, {
        context: {
            headers: {
                Authorization: `Bearer ${token}`,
                'Apollo-Require-Preflight': 'true',
            },
        },
    });

    const deleteNomerFromCategory = async () => {
        let request = await deleteAirlineManager({
            variables: {
                "deleteUserId": deleteNomer.user.id
            }
        });

        if (request) {
            setAddTarif(prevTarifs => {
                return prevTarifs.map(tarif => {
                    if (tarif.name === deleteNomer.category) {
                        const updatedNumbers = tarif.users.filter(user => user.id !== deleteNomer.user.id);
                        return { ...tarif, users: updatedNumbers };
                    }
                    return tarif;
                });
            });

            setShowDelete(false);
            setDeleteNomer(null);
        }
    };

    const openDeleteComponent = (index, id) => {
        setShowDelete(true);
        setDeleteIndex({ index, id });
        setShowEditCategory(false);
    };

    const closeDeleteComponent = () => {
        setShowDelete(false);
        setShowEditCategory(false);
    };

    const toggleEditNomer = (user, department) => {
        setSelectedNomer({ user, department });
        setShowEditNomer(true);
    }

    const handleEditNomer = (updatedNomer) => {
        setAddTarif(updatedNomer);
        setShowEditNomer(false);
        setSelectedNomer({});
    };

    // const uniqueCategories = Array.from(new Set(addTarif.map(request => request.type)));

    const filteredRequestsTarif = addTarif.filter(request => {
        const matchesCategory = selectQuery === '' || request.name.toLowerCase().includes(selectQuery.toLowerCase());

        const matchesSearch = searchTarif === '' ||
            request.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
            request.users.some(user =>
                user.name.toLowerCase().includes(searchTarif.toLowerCase()) ||
                user.role.toLowerCase().includes(searchTarif.toLowerCase())
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
                        toggleSidebar={toggleCategory}
                        handleChange={''}
                        buttonTitle={'Добавить отдел'}
                    />
                    <Filter
                        toggleSidebar={toggleTarifs}
                        handleChange={''}
                        buttonTitle={'Добавить аккаунт менеджера'}
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

            <CreateRequestAirlineCompany id={id} show={showAddTarif} onClose={toggleTarifs} addTarif={addTarif} setAddTarif={setAddTarif} />
            <CreateRequestAirlineOtdel id={id} show={showAddCategory} onClose={toggleCategory} addTarif={addTarif} setAddTarif={setAddTarif} />

            <EditRequestAirlineCompany
                id={id}
                show={showEditNomer}
                onClose={() => setShowEditNomer(false)}
                user={selectedNomer.user}
                department={selectedNomer.department}
                onSubmit={handleEditNomer}
                addTarif={addTarif}
            // uniqueCategories={uniqueCategories}
            />
            <EditRequestAirlineOtdel id={id} show={showEditCategory} onClose={() => setShowEditCategory(false)} category={selectedCategory} onSubmit={handleEditCategory} />

            {showDelete && (
                <DeleteComponent
                    ref={deleteComponentRef}
                    remove={deleteNomer ? deleteNomerFromCategory : () => deleteTarif(deleteIndex.index, deleteIndex.id)}
                    close={closeDeleteComponent}
                    title={`Вы действительно хотите удалить ${deleteNomer ? 'менеджера' : 'отдел'}?`}
                />
            )}
        </>
    );
}

export default AirlineCompany_tabComponent;