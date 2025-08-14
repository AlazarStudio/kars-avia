import React, { useState, useEffect } from "react";
import classes from './AirlineAnalytics.module.css';
import AnalyticsChart from '../../AnalyticsChart/AnalyticsChart';
import DateRangePickerCustom from "../../DateRangePickerCustom";
import { addDays, formatISO, startOfToday, format, eachDayOfInterval } from "date-fns";
import { GET_AIRLINES_RELAY, GET_ANALYTICS_AIRLINE_REQUESTS, getCookie } from "../../../../../../graphQL_requests";
import { useQuery } from "@apollo/client";

function fillMissingDates(data, startDate, endDate) {
  const allDates = eachDayOfInterval({ start: startDate, end: endDate });

  const map = new Map(data.map(item => [item.date.slice(0, 10), item.count]));

  return allDates.map(date => {
    const formatted = format(date, "yyyy-MM-dd");
    return {
      date: formatted,
      count: map.get(formatted) ?? 0
    };
  });
}

function AirlineAnalytics() {
  const token = getCookie("token");

  const [dateRange, setDateRange] = useState({
    startDate: addDays(startOfToday(), -6),
    endDate: startOfToday(),
    key: "selection"
  });

  const [showPicker, setShowPicker] = useState(false);
  const [airlines, setAirlines] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState([]);

  const { data: airlinesData, refetch: refetchAirlines } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  useEffect(() => {
    if (airlinesData?.airlines?.airlines) {
      setAirlines(airlinesData.airlines.airlines || []);
    }
  }, [airlinesData]);

  const airlineId = selectedAirline.id || airlines[0]?.id;

  const { data, refetch } = useQuery(GET_ANALYTICS_AIRLINE_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      input: {
        filters: {
          airlineId
        },
        startDate: formatISO(dateRange.startDate, { representation: 'date' }) + 'T00:00:00',
        endDate: formatISO(dateRange.endDate, { representation: 'date' }) + 'T23:59:59',
      }
    }
  });

  useEffect(() => {
    refetch({
      input: {
        filters: {
          airlineId
        },
        startDate: formatISO(dateRange.startDate, { representation: 'date' }),
        endDate: formatISO(dateRange.endDate, { representation: 'date' }),
      }
    });
  }, [dateRange]);

  const rawCreatedRequests = data?.analyticsEntityRequests?.createdByPeriod?.map(item => ({
    date: item.date,
    count: item.count_created
  })) || [];

  const createdRequests = fillMissingDates(rawCreatedRequests, dateRange.startDate, dateRange.endDate);

  return (
    <div className={classes.container}>
      <div className={classes.sidebar}>
        <input type="text" placeholder="Поиск" name="search" id="search" />
        <ul className={classes.list}>
          {airlines.map(airline => (
            <li key={airline.id} className={`${classes.listItem} ${selectedAirline.id === airline.id ? classes.active : ''}`} onClick={() => setSelectedAirline({ id: airline.id, name: airline.name })}>
              <div className={classes.circle}></div>
              <p>{airline.name}</p>
            </li>
          ))
          }
        </ul>
      </div>

      <div className={classes.content}>
        <div className={classes.graphs}>
          <div className={classes.header}>

            <h2 className={classes.title}>
              <div className={classes.circle}></div>
              <p>{selectedAirline.name}</p>
            </h2>

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
          </div>

          <div className={classes.contentWrapper}>
            <div className={classes.row}>
              <AnalyticsChart
                type="bar"
                title="Количество созданных заявок"
                data={createdRequests}
                xKey="date"
                yKey="count"
              />

              <AnalyticsChart
                type="pie"
                title="Отмененные заявки"
                data={[
                  { x: "Отработанные", value: data?.analyticsEntityRequests?.totalCreatedRequests || 0 },
                  { x: "Отмененые", value: data?.analyticsEntityRequests?.totalCancelledRequests || 0 },
                ]}
                xKey="x"
                dataKey="value"
              />

              {/* <AnalyticsChart
                  type="line"
                  title="Среднее время ожидания обработки заявки"
                  data={filteredAverageTime}
                  xKey="date"
                  yKey="hours"
                /> */}
            </div>

            {/* <div className={classes.row}>
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

              </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AirlineAnalytics;