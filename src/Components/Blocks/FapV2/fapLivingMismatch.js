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

const seatKey = (seat) => String(seat ?? "").trim().toUpperCase();

// Место живёт ТОЛЬКО в реестре (PassengerRequestSavedPerson.seat); у гостя гостиницы
// такого поля в схеме нет, поэтому место подтягивается по personId.
const seatIndexOf = (savedPassengers) => {
  const map = new Map();
  (Array.isArray(savedPassengers) ? savedPassengers : []).forEach((person) => {
    if (person?.personId) map.set(person.personId, seatKey(person.seat));
  });
  return map;
};

// Совпадения ФИО по ВСЕЙ услуге проживания, включая совпадения внутри одной гостиницы.
// Ключ — manifestNameKey (зеркало бэкового normalizeFullNameKey). Искать по personId
// бесполезно: сканер посадочного и ручное добавление personId не шлют, бэк выдаёт
// каждому новый uuid, поэтому один человек, заведённый дважды, имеет два разных id.
//
// МЕСТО — второй различитель. Оно не ужесточает правило, а уточняет вердикт:
//   • места известны у всех и РАЗНЫЕ  → это тёзки, совпадением не считаем;
//   • места известны у всех и ОДНО    → почти наверняка один человек дважды (seatMatch);
//   • место известно не у всех        → прежнее поведение, «совпадает ФИО, проверьте».
// Требовать совпадения места было нельзя: замер дев-стенда показал, что ни в одной из
// 38 текущих коллизий место не заполнено у всех участников — правило стало бы мёртвым.
export const livingNameCollisions = (livingService, savedPassengers) => {
  const hotels = Array.isArray(livingService?.hotels) ? livingService.hotels : [];
  const seats = seatIndexOf(savedPassengers);
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
        seat: seats.get(person?.personId) || "",
      });
    });
  });

  return [...byKey.values()]
    .filter((item) => item.places.length > 1)
    .map((item) => {
      const known = item.places.map((p) => p.seat).filter(Boolean);
      const allKnown = known.length === item.places.length;
      const unique = new Set(known).size;
      return {
        ...item,
        // Различить удалось только когда место есть у КАЖДОГО: одно пустое место
        // ничего не доказывает ни в ту, ни в другую сторону.
        seatMatch: allKnown && unique === 1,
        seatConflict: allKnown && unique > 1,
      };
    })
    .filter((item) => !item.seatConflict);
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
  const collisions = livingNameCollisions(livingService, request?.savedPassengers);
  return {
    overbooked,
    collisions,
    hasAny: overbooked.length > 0 || collisions.length > 0,
  };
};
