// Факт поездки трансфера: поимённый список ИЛИ «перевезено N» — что больше.
// max, а не сумма: скан водителя добавляет тех же людей, которых диспетчер уже
// учёл числом. Зеркалит driverFactCount/transferFactCount бэка (serviceStatus.js).
export const driverFactCount = (driver) => {
  const listed = Array.isArray(driver?.people) ? driver.people.length : 0;
  const counted = Number.isInteger(driver?.transportedCount)
    ? Math.max(driver.transportedCount, 0)
    : 0;
  return Math.max(listed, counted);
};

export const transferFactCount = (drivers) =>
  (Array.isArray(drivers) ? drivers : []).reduce(
    (sum, d) => sum + driverFactCount(d),
    0
  );
