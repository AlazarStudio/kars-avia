import { useState, useEffect, useMemo } from "react";
import classes from "./PatchNotesList.module.css";
import Header from "../Header/Header";
import { useQuery, useMutation } from "@apollo/client";
import {
  convertToDate,
  CREATE_PATCH_NOTE,
  GET_ALL_PATCH_NOTES,
  getCookie,
} from "../../../../graphQL_requests";
import { roles } from "../../../roles";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import InfoTableDataPatchNotes from "../InfoTableDataPatchNotes/InfoTableDataPatchNotes";
import CreateRequestPatchNote from "../CreateRequestPatchNote/CreateRequestPatchNote";
import EditRequestPatchNote from "../EditRequestPatchNote/EditRequestPatchNote";
import DateRangeModalSelector from "../DateRangeModalSelector/DateRangeModalSelector";
import Button from "../../Standart/Button/Button";
import { useToast } from "../../../contexts/ToastContext";
import { useDialog } from "../../../contexts/DialogContext";
import patchNotesSeed from "../../../../scripts/patchNotes.data.mjs";

function PatchNotesList({ user }) {
  const token = getCookie("token");
  const { success, error: notifyError, info } = useToast();
  const { confirm: confirmDialog } = useDialog();
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [companyData, setCompanyData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);

  const [importPatchNote] = useMutation(CREATE_PATCH_NOTE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const { loading, error, data, refetch } = useQuery(GET_ALL_PATCH_NOTES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // в этой версии проблема с дублированием
  useEffect(() => {
    if (data && data.getAllPatchNotes) {
      // const sortedHotels = [...data.getAllPatchNotes].sort((a, b) =>
      //   a.information?.city?.localeCompare(b.information?.city)
      // );
      setCompanyData(data.getAllPatchNotes);
    }

    // if (dataSubscription && dataSubscription.hotelCreated) {
    //   setCompanyData((prevCompanyData) => {
    //     const updatedData = [...prevCompanyData, dataSubscription.hotelCreated];
    //     return updatedData.sort((a, b) =>
    //       a.information?.city?.localeCompare(b.information?.city)
    //     );
    //   });
    //   refetch();
    // }
  }, [data, refetch]);
  // }, [data, refetch, dataSubscription, dataSubscriptionUpd]);

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
  };

  // Массовый импорт патч-нот из seed-файла (только суперадмин).
  // Токен берётся из cookie, существующие по названию пропускаются.
  const handleImportAll = async () => {
    const existingNames = new Set(companyData.map((p) => p.name));
    const toCreate = patchNotesSeed.filter((n) => !existingNames.has(n.name));

    if (toCreate.length === 0) {
      info("Все патч-ноты уже добавлены.");
      return;
    }

    const ok = await confirmDialog(
      `Создать ${toCreate.length} патч-нот? Существующие по названию будут пропущены.`
    );
    if (!ok) return;

    setImporting(true);
    let created = 0;
    let failed = 0;
    for (const note of toCreate) {
      try {
        await importPatchNote({
          variables: {
            data: {
              name: note.name,
              description: note.description,
              date: note.date,
            },
          },
        });
        created += 1;
      } catch {
        failed += 1;
      }
    }
    setImporting(false);
    refetch();

    if (failed === 0) {
      success(`Импортировано патч-нот: ${created}.`);
    } else {
      notifyError(`Импортировано ${created}, ошибок ${failed}.`);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const filteredRequests = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return companyData.filter((request) => {
      const { startDate, endDate } = dateRange;
      const reqDate = new Date(request.date);
      const plainDescription = request.description
        ?.replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const matchesSearch =
        !normalizedQuery ||
        plainDescription?.includes(normalizedQuery) ||
        request.name?.toLowerCase().includes(normalizedQuery) ||
        convertToDate(request.date, false).toLowerCase().includes(normalizedQuery);

      const matchesDate =
        startDate && endDate
          ? reqDate >= startDate && reqDate <= endDate
          : true;

      return matchesSearch && matchesDate;
    });
  }, [companyData, dateRange, searchQuery]);

  console.log("filteredRequests", filteredRequests);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (dateRange.startDate && dateRange.endDate) count += 1;
    return count;
  }, [dateRange.endDate, dateRange.startDate, searchQuery]);

  const [patchNoteId, setPatchNoteId] = useState();
  const [showEditPatchNote, setShowEditPatchNote] = useState(false);
  const toggleEditPatchNote = (patchNote) => {
    setPatchNoteId(patchNote?.id);
    setShowEditPatchNote(true);
  };
  return (
    <>
      <div className={classes.section}>
        <Header>Patch Notes</Header>

        <div className={classes.section_searchAndFilter}>
          <DateRangeModalSelector
            width={"190px"}
            initialRange={dateRange}
            onChange={(start, end) =>
              setDateRange({ startDate: start, endDate: end })
            }
          />
          <MUITextField
            label={"Поиск"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
          {user.role === roles.superAdmin && (
            <div className={classes.searchActions}>
              <Button
                onClick={handleImportAll}
                padding="0 18px"
                backgroundcolor="#fff"
                color="#0057C3"
                border="1px solid #0057C3"
                disabled={importing}
              >
                {importing ? "Импорт…" : "Импортировать всё"}
              </Button>
              <Button onClick={toggleCreateSidebar} padding="0 18px">
                Добавить патч
              </Button>
            </div>
          )}
        </div>

        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <InfoTableDataPatchNotes
            toggleRequestSidebar={toggleEditPatchNote}
            requests={filteredRequests}
          />
        )}
        <CreateRequestPatchNote
          show={showCreateSidebar}
          onClose={toggleCreateSidebar}
          refetchPatchNotes={refetch}
        />

        <EditRequestPatchNote
          user={user}
          show={showEditPatchNote}
          onClose={() => setShowEditPatchNote(false)}
          patchNoteId={patchNoteId}
          refetchPatchNotes={refetch}
        />
      </div>
    </>
  );
}

export default PatchNotesList;
