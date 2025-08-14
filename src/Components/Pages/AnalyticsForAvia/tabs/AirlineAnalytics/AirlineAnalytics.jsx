import React, { useState } from "react";
import classes from './AirlineAnalytics.module.css';
import AnalyticsChart from '../../AnalyticsChart/AnalyticsChart';
import { airlineAnalyticsMock } from '../../mockAirlineAnalytics';
import DateRangePickerCustom from "../../DateRangePickerCustom";
import { addDays, startOfToday } from "date-fns";


const mockAirlines = Object.entries(airlineAnalyticsMock)
  .map(([id, data]) => ({ id, name: data.name }))
  .sort((a, b) => a.name.localeCompare(b.name));


function AirlineAnalytics() {
  const firstAirlineId = Object.keys(airlineAnalyticsMock)[0];
  const [selectedAirline, setSelectedAirline] = useState(firstAirlineId);
  const selectedData = airlineAnalyticsMock[selectedAirline];
  const [dateRange, setDateRange] = useState({
    startDate: addDays(startOfToday(), -6), // сегодня минус 6 дней — итого 7 включительно
    endDate: startOfToday(),
    key: "selection"
  });
  const [showPicker, setShowPicker] = useState(false);

  function filterByDateRange(data, startDate, endDate) {
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1); // ← прибавляем день

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate < adjustedEndDate; // строго меньше
    });
  }


  const filteredCreated = dateRange
    ? filterByDateRange(selectedData.createdRequests, dateRange.startDate, dateRange.endDate)
    : selectedData.createdRequests;

  const filteredDuplicated = dateRange
    ? filterByDateRange(selectedData.duplicatedRequests, dateRange.startDate, dateRange.endDate)
    : selectedData.duplicatedRequests;

  const filteredAverageTime = filterByDateRange(
    selectedData.averageProcessingTime,
    dateRange.startDate,
    dateRange.endDate
  );

  return (
    <div className={classes.container}>
      <div className={classes.sidebar}>
        <input type="text" placeholder="Поиск" name="search" id="search" />

        {/* <button className={classes.viewAllBtn} onClick={() => setSelectedAirline(null)}>
          Смотреть по всем
        </button> */}

        <ul className={classes.list}>
          {mockAirlines.map((airline) => (
            <li
              key={airline.id}
              className={`${classes.listItem} ${selectedAirline === airline.id ? classes.active : ''}`}
              onClick={() => setSelectedAirline(airline.id)}
            >
              <div className={classes.circle}></div>{airline.name}
            </li>
          ))}
        </ul>
      </div>

      <div className={classes.content}>

        {selectedData && (
          <div className={classes.graphs}>
            <div className={classes.header}>
              <h2 className={classes.title}>
                <div className={classes.circle}></div>
                {selectedData.name}
              </h2>

              <>
                <button onClick={() => setShowPicker(true)}>Выбрать период</button>

                {showPicker && (
                  <DateRangePickerCustom
                    value={dateRange}
                    onChange={(range) => {
                      setDateRange(range);
                      setShowPicker(false);
                    }}
                    onClose={() => setShowPicker(false)}
                  />
                )}
              </>
            </div>

            <div className={classes.row}>
              <AnalyticsChart
                type="bar"
                title="Количество созданных заявок"
                data={filteredCreated}
                xKey="date"
                yKey="count"
              />

              <AnalyticsChart
                type="line"
                title="Среднее время ожидания обработки заявки"
                data={filteredAverageTime}
                xKey="date"
                yKey="hours"
              />
            </div>

            <div className={classes.row}>
              <AnalyticsChart
                type="pie"
                title="Заявки по статусам"
                data={[
                  { x: "Создано", value: selectedData.cancelledRatio.created },
                  { x: "Продлено", value: selectedData.cancelledRatio.extended },
                  { x: "Забронировано", value: selectedData.cancelledRatio.booked },
                  { x: "Ранний заезд", value: selectedData.cancelledRatio.early_checkin },
                  { x: "Перенесено ", value: selectedData.cancelledRatio.rescheduled },
                  { x: "Сокращено ", value: selectedData.cancelledRatio.shortened },
                  { x: "Готово к архиву ", value: selectedData.cancelledRatio.ready_to_archive },
                  { x: "Архив", value: selectedData.cancelledRatio.archived }
                ]}
                xKey="x"
                dataKey="value"
              />

              <AnalyticsChart
                type="bar"
                title="Количество дублированных заявок"
                data={filteredDuplicated}
                xKey="date"
                yKey="count"
              />

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AirlineAnalytics;
