import { useEffect, useMemo, useRef } from "react";
import classes from "./InfoTableDataPatchNotes.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { convertToDate } from "../../../../graphQL_requests";

function InfoTableDataPatchNotes({ toggleRequestSidebar, requests, pageInfo }) {
  const listContainerRef = useRef(null);

  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
  }, [pageInfo, requests]);

  const groupedRequests = useMemo(() => {
    const sortedRequests = [...requests].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return sortedRequests.reduce((acc, item) => {
      const date = new Date(item.date);
      const groupKey = date.toLocaleString("ru-RU", {
        month: "long",
        year: "numeric",
      });

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }

      acc[groupKey].push(item);
      return acc;
    }, {});
  }, [requests]);

  return (
    <InfoTable>
      <div className={classes.bottom} ref={listContainerRef}>
        <div className={classes.content}>
          {requests.length === 0 ? (
            <div className={classes.emptyState}>
              <div className={classes.emptyStateBadge}>0 записей</div>
              <div className={classes.emptyStateTitle}>Ничего не найдено</div>
              <div className={classes.emptyStateText}>
                Попробуйте изменить период или поисковый запрос, чтобы увидеть
                нужные патчи.
              </div>
            </div>
          ) : (
            Object.entries(groupedRequests).map(([groupTitle, groupItems]) => (
              <section className={classes.group} key={groupTitle}>
                <div className={classes.groupHeader}>
                  <div className={classes.groupTitle}>{groupTitle}</div>
                  <div className={classes.groupCount}>
                    {groupItems.length} обновл.
                  </div>
                </div>

                <div className={classes.cards}>
                  {groupItems.map((item) => (
                    <button
                      type="button"
                      className={classes.patchCard}
                      onClick={() => toggleRequestSidebar(item)}
                      key={item.id}
                    >
                      <div className={classes.cardTop}>
                        <div className={classes.cardDate}>
                          {convertToDate(item.date, false)}
                        </div>
                        <div className={classes.cardBadge}>Patch note</div>
                      </div>

                      <div className={classes.cardTitle}>{item.name}</div>

                      <div
                        className={classes.cardDescription}
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />

                      <div className={classes.cardFooter}>
                        <div className={classes.cardFooterHint}>
                          Нажмите, чтобы открыть подробности
                        </div>
                        <div className={classes.cardFooterAction}>
                          Открыть запись
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </InfoTable>
  );
}

export default InfoTableDataPatchNotes;
