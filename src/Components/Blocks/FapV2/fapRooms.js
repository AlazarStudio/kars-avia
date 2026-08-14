// Чистые функции реального номерного фонда гостиницы для проживания ФАП.
// Совпадение номера гостя с реальным номером — по roomKey (trim), тот же ключ,
// что использует группировка отчёта.

import { roomKey } from "./fapGroups.js";
import {
  CATEGORY_STATED_PLACES,
  categoryShortLabel,
} from "../../../utils/roomCategories.js";

export const roomCategoryLabel = categoryShortLabel;

// Вместимость номера: из категории, иначе places, иначе beds, иначе null.
// Берём только те категории, где число мест названо в самой категории
// («3-местный», «Стандарт дабл»). У «Люкса» и апартаментов серверные 2 места —
// это дефолт, а не факт о номере, и places самого номера точнее.
export const roomCapacity = (room) => {
  if (!room) return null;
  const byCat = CATEGORY_STATED_PLACES[room.category];
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
