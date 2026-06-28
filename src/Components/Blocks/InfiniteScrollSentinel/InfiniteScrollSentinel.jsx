import MUILoader from "../MUILoader/MUILoader";
import classes from "./InfiniteScrollSentinel.module.css";

/**
 * Якорь подгрузки + лоадер догрузки + плашка «конец списка».
 * sentinelRef навешивается на якорь (берётся из useInfiniteScroll).
 */
function InfiniteScrollSentinel({
  sentinelRef,
  loadingMore,
  hasMore,
  hasItems,
  endLabel = "Больше ничего нет",
  loaderSize = "28px",
}) {
  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        style={{ height: 1, width: "100%" }}
      />
      {loadingMore && (
        <div className={classes.loaderRow}>
          <MUILoader loadSize={loaderSize} fullHeight={"unset"} />
        </div>
      )}
      {!hasMore && hasItems && (
        <div className={classes.endOfListNote}>{endLabel}</div>
      )}
    </>
  );
}

export default InfiniteScrollSentinel;
