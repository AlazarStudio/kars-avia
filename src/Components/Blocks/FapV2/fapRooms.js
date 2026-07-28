// Чистые функции реального номерного фонда гостиницы для проживания ФАП.
// Совпадение номера гостя с реальным номером — по roomKey (trim), тот же ключ,
// что использует группировка отчёта.

import { roomKey } from "./fapGroups.js";

// Категория «N-местный» → вместимость числом.
const PLACE_CATEGORY_COUNT = {
  onePlace: 1, twoPlace: 2, threePlace: 3, fourPlace: 4, fivePlace: 5,
  sixPlace: 6, sevenPlace: 7, eightPlace: 8, ninePlace: 9, tenPlace: 10,
};

const ROOM_CATEGORY_LABEL = {
  onePlace: "1-местный", twoPlace: "2-местный", threePlace: "3-местный",
  fourPlace: "4-местный", fivePlace: "5-местный", sixPlace: "6-местный",
  sevenPlace: "7-местный", eightPlace: "8-местный", ninePlace: "9-местный",
  tenPlace: "10-местный", apartment: "Апартаменты", studio: "Студия", luxe: "Люкс",
};

export const roomCategoryLabel = (category) =>
  ROOM_CATEGORY_LABEL[category] ?? (category || "");

// Вместимость номера: из категории, иначе places, иначе beds, иначе null.
export const roomCapacity = (room) => {
  if (!room) return null;
  const byCat = PLACE_CATEGORY_COUNT[room.category];
  if (byCat != null) return byCat;
  const places = Number(room.places);
  if (Number.isFinite(places) && places > 0) return places;
  const beds = Number(room.beds);
  if (Number.isFinite(beds) && beds > 0) return beds;
  return null;
};

// Активные номера с непустым именем (для списка опций).
export const activeHotelRooms = (rooms) =>
  (Array.isArray(rooms) ? rooms : []).filter((r) => r?.active && r?.name);

// Индекс active-номеров по roomKey(name); при коллизии имён — первый выигрывает.
export const buildRoomsIndex = (rooms) => {
  const map = new Map();
  activeHotelRooms(rooms).forEach((r) => {
    const k = roomKey(r.name);
    if (k && !map.has(k)) map.set(k, r);
  });
  return map;
};

// Реальный номер по номеру гостя (или null).
export const matchHotelRoom = (roomNumber, roomsIndex) => {
  if (!roomsIndex) return null;
  return roomsIndex.get(roomKey(roomNumber)) ?? null;
};

// Занятость: Map<roomKey, count> по списку назначенных номеров.
export const roomOccupancy = (roomNumbers) => {
  const map = new Map();
  (Array.isArray(roomNumbers) ? roomNumbers : []).forEach((n) => {
    const k = roomKey(n);
    if (!k) return;
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return map;
};
