import React, { useEffect, useState } from "react";
import classes from "./AirlineTransferPrices_tabComponent.module.css";
import {
  getCookie,
  GET_AIRLINE_TRANSFER_PRICES,
  GET_AIRPORTS_RELAY,
  GET_CITIES,
  UPDATE_AIRLINE,
  DELETE_AIRLINE_TRANSFER_PRICE,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUITextField from "../MUITextField/MUITextField.jsx";
import { useToast } from "../../../contexts/ToastContext";
import Filter from "../Filter/Filter.jsx";
import InfoTableOrganizationTransferPrices from "../InfoTableOrganizationTransferPrices/InfoTableOrganizationTransferPrices.jsx";
import TransferPriceSidebarForm from "../TransferPriceSidebarForm/TransferPriceSidebarForm.jsx";
import DeleteComponent from "../DeleteComponent/DeleteComponent.jsx";
import {
  transferPriceToInput,
  transferPriceInputsToPayload,
} from "../../../utils/transferPrices.js";

function AirlineTransferPrices_tabComponent({ id, user, accessMenu }) {
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const { loading, error, data, refetch } = useQuery(GET_AIRLINE_TRANSFER_PRICES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { airlineId: id },
  });

  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: citiesData } = useQuery(GET_CITIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [updateAirline] = useMutation(UPDATE_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [deleteAirlineTransferPrice] = useMutation(
    DELETE_AIRLINE_TRANSFER_PRICE,
    {
      context: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  const [transferPricesInput, setTransferPricesInput] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddSidebar, setShowAddSidebar] = useState(false);
  const [showEditSidebar, setShowEditSidebar] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editInitialMode, setEditInitialMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  useEffect(() => {
    if (!data?.airline) return;
    const list = data.airline.transferPrices;
    if (Array.isArray(list) && list.length > 0) {
      setTransferPricesInput(list.map(transferPriceToInput));
    } else {
      setTransferPricesInput([]);
    }
  }, [data?.airline?.id, data?.airline?.transferPrices]);

  const saveTransferPrices = async (newList) => {
    setIsSaving(true);
    try {
      const payload = transferPriceInputsToPayload(newList);
      await updateAirline({
        variables: {
          updateAirlineId: id,
          input: { transferPrices: payload },
          images: null,
        },
      });
      success("Цены на трансфер сохранены.");
      refetch();
    } catch (err) {
      console.error("Ошибка сохранения цен на трансфер:", err);
      notifyError(err?.message || "Не удалось сохранить цены на трансфер.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSidebarSubmit = (formRecord) => {
    if (showEditSidebar && editIndex !== null) {
      const newList = transferPricesInput.map((r, i) =>
        i === editIndex ? formRecord : r
      );
      setTransferPricesInput(newList);
      saveTransferPrices(newList);
      setShowEditSidebar(false);
      setEditIndex(null);
    } else {
      const newList = [...transferPricesInput, formRecord];
      setTransferPricesInput(newList);
      saveTransferPrices(newList);
      setShowAddSidebar(false);
    }
  };

  const handleEdit = (item, index) => {
    setEditIndex(index);
    setEditInitialMode(true);
    setShowEditSidebar(true);
  };

  const handleView = (item, index) => {
    setEditIndex(index);
    setEditInitialMode(false);
    setShowEditSidebar(true);
  };

  const handleDeleteClick = (item) => {
    if (item?.id) setDeleteConfirmItem(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem?.id) return;
    try {
      const res = await deleteAirlineTransferPrice({
        variables: { id: deleteConfirmItem.id },
      });
      if (res?.data?.deleteAirlineTransferPrice) {
        success("Цена на трансфер удалена.");
        refetch();
      } else {
        notifyError("Не удалось удалить цену на трансфер.");
      }
    } catch (err) {
      console.error(err);
      notifyError(err?.message || "Не удалось удалить цену на трансфер.");
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  const airports = airportsData?.airports ?? [];
  const cities = citiesData?.citys ?? [];

  const filteredRequests = transferPricesInput.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const intercity = [
      item.prices?.threeSeater?.intercity,
      item.prices?.fiveSeater?.intercity,
      item.prices?.sevenSeater?.intercity,
    ]
      .filter(Boolean)
      .join(" ");
    const city = [
      item.prices?.threeSeater?.city,
      item.prices?.fiveSeater?.city,
      item.prices?.sevenSeater?.city,
    ]
      .filter(Boolean)
      .join(" ");
    const airportLabels = (item.airportIds || [])
      .map((aid) => airports.find((a) => a.id === aid)?.name || aid)
      .join(" ");
    const cityLabels = (item.cityIds || [])
      .map((cid) => cities.find((c) => c.id === cid)?.city || cid)
      .join(" ");
    return (
      intercity.toLowerCase().includes(q) ||
      city.toLowerCase().includes(q) ||
      airportLabels.toLowerCase().includes(q) ||
      cityLabels.toLowerCase().includes(q)
    );
  });

  if (loading) return <MUILoader fullHeight="70vh" />;
  if (error) return <p>Ошибка: {error.message}</p>;
  if (!data?.airline) return null;

  return (
    <div className={classes.tariffsWrapper}>
      <div className={classes.section_searchAndFilter}>
        <MUITextField
          className={classes.mainSearch}
          label="Поиск по договорам"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className={classes.section_searchAndFilter_filter}>
          <Filter
            user={user}
            toggleSidebar={() => setShowAddSidebar(true)}
            handleChange={() => {}}
            buttonTitle="Добавить договор"
          />
        </div>
      </div>

      <InfoTableOrganizationTransferPrices
        requests={filteredRequests}
        airports={airports}
        cities={cities}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onRowClick={handleView}
      />

      <TransferPriceSidebarForm
        show={showAddSidebar}
        onClose={() => setShowAddSidebar(false)}
        mode="add"
        airports={airports}
        cities={cities}
        onSubmit={handleSidebarSubmit}
      />

      <TransferPriceSidebarForm
        show={showEditSidebar}
        onClose={() => {
          setShowEditSidebar(false);
          setEditIndex(null);
        }}
        mode="edit"
        initialValue={editIndex !== null ? transferPricesInput[editIndex] : null}
        airports={airports}
        cities={cities}
        onSubmit={handleSidebarSubmit}
        initialEditMode={editInitialMode}
        onDelete={(item) => {
          setShowEditSidebar(false);
          setEditIndex(null);
          setDeleteConfirmItem(item ?? (editIndex !== null ? transferPricesInput[editIndex] : null));
        }}
      />

      {deleteConfirmItem && (
        <DeleteComponent
          title="Вы действительно хотите удалить цену на трансфер?"
          remove={handleDeleteConfirm}
          close={() => setDeleteConfirmItem(null)}
        />
      )}
    </div>
  );
}

export default AirlineTransferPrices_tabComponent;
