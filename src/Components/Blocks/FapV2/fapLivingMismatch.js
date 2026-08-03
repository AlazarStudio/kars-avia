import { manifestNameKey } from "../../../utils/manifestCore.js";

// peopleCount 0/null означает «вместимость не задана», а не «мест нет»: так это трактуют
// и бэк (passengerRequest.resolver.js), и выпадашка выбора гостиницы при переселении.
// Иначе гостиница без заполненной вместимости считалась бы вечно переполненной.
export const hotelOverbookedBy = (hotel) => {
  const capacity = Number(hotel?.peopleCount) || 0;
  if (capacity <= 0) return 0;
  const placed = Array.isArray(hotel?.people) ? hotel.people.length : 0;
  return Math.max(0, placed - capacity);
};

// Совпадения ФИО по ВСЕЙ услуге проживания, включая совпадения внутри одной гостиницы.
// Ключ — manifestNameKey (зеркало бэкового normalizeFullNameKey). Искать по personId
// бесполезно: сканирование посадочного personId не шлёт, бэк подставляет новый uuid
// каждому, поэтому один человек в двух гостиницах имеет два разных id.
// ⚠️ Тёзки дают ложное срабатывание — по манифестам зафиксировано, что близнецы с
// одинаковым ФИО это разные люди. Принято осознанно, поэтому формулировка в UI —
// «совпадает ФИО», а не «дубль».
export const livingNameCollisions = (livingService) => {
  const hotels = Array.isArray(livingService?.hotels) ? livingService.hotels : [];
  const byKey = new Map();
  hotels.forEach((hotel, hotelIndex) => {
    const people = Array.isArray(hotel?.people) ? hotel.people : [];
    people.forEach((person, personIndex) => {
      const key = manifestNameKey(person?.fullName);
      if (!key) return;
      if (!byKey.has(key)) {
        byKey.set(key, { nameKey: key, fullName: person.fullName, places: [] });
      }
      byKey.get(key).places.push({
        hotelIndex,
        personIndex,
        hotelName: hotel?.name || "",
      });
    });
  });
  return [...byKey.values()].filter((item) => item.places.length > 1);
};

export const livingMismatches = (request) => {
  const livingService = request?.livingService;
  const hotels = Array.isArray(livingService?.hotels) ? livingService.hotels : [];
  const overbooked = hotels
    .map((hotel, hotelIndex) => ({
      hotelIndex,
      hotelName: hotel?.name || "",
      placed: Array.isArray(hotel?.people) ? hotel.people.length : 0,
      capacity: Number(hotel?.peopleCount) || 0,
      by: hotelOverbookedBy(hotel),
    }))
    .filter((item) => item.by > 0);
  const collisions = livingNameCollisions(livingService);
  return {
    overbooked,
    collisions,
    hasAny: overbooked.length > 0 || collisions.length > 0,
  };
};
