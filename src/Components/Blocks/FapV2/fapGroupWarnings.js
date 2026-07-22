import { requestGroups, groupTogetherLevel, roomKey } from "./fapGroups";

// Ворнинги групп и требований. Принцип: незаселённость — НЕ нарушение.
// Гости без personId предикатами пропускаются, но входят в occupancy номера.
export function computeFapGroupWarnings(request) {
  const hotels = request?.livingService?.hotels ?? [];
  const placement = new Map(); // personId → { hotelIndex, hotelName, room }
  const occByHotelRoom = new Map(); // `${hi}|${roomKey}` → count(все гости)
  hotels.forEach((h, hi) => {
    (h?.people ?? []).forEach((p) => {
      const rk = roomKey(p.roomNumber);
      if (rk) {
        const k = `${hi}|${rk}`;
        occByHotelRoom.set(k, (occByHotelRoom.get(k) ?? 0) + 1);
      }
      if (p.personId && !placement.has(p.personId)) {
        placement.set(p.personId, {
          hotelIndex: hi,
          hotelName: h?.name ?? "",
          room: rk,
        });
      }
    });
  });

  const byGroupId = new Map();
  requestGroups(request).forEach((g) => {
    const placed = (g.memberPersonIds ?? [])
      .map((pid) => ({ pid, at: placement.get(pid) }))
      .filter((x) => x.at);
    const hotelsUsed = [...new Set(placed.map((x) => x.at.hotelIndex))];
    const w = { splitHotels: null, splitRooms: null };
    if (hotelsUsed.length >= 2) {
      // ≥2 РАЗНЫХ участников в разных гостиницах (один человек в двух отелях не считается)
      w.splitHotels = hotelsUsed.map((hi) => ({
        hotelIndex: hi,
        count: placed.filter((x) => x.at.hotelIndex === hi).length,
        hotelName: hotels[hi]?.name ?? "",
      }));
    } else if (groupTogetherLevel(g) === "ROOM" && hotelsUsed.length === 1) {
      const rooms = [...new Set(placed.map((x) => x.at.room).filter(Boolean))];
      if (rooms.length >= 2) w.splitRooms = rooms;
    }
    if (w.splitHotels || w.splitRooms) byGroupId.set(g.groupId, w);
  });

  const byPersonId = new Map(); // personId → { requirement, occ, room }
  const reqByPerson = new Map(
    (request?.savedPassengers ?? [])
      .filter(
        (sp) =>
          Number.isInteger(sp.placementRequirement) &&
          sp.placementRequirement >= 1
      )
      .map((sp) => [sp.personId, sp.placementRequirement])
  );
  placement.forEach((at, pid) => {
    const req = reqByPerson.get(pid);
    if (!req || !at.room) return;
    const occ = occByHotelRoom.get(`${at.hotelIndex}|${at.room}`) ?? 0;
    if (occ > req) byPersonId.set(pid, { requirement: req, occ, room: at.room });
  });

  return { byGroupId, byPersonId };
}

// Человекочитаемый текст ворнинга группы (W1 приоритетнее W2).
export const groupWarningText = (w) => {
  if (!w) return "";
  if (w.splitHotels) {
    const parts = w.splitHotels.map(
      (h) => `${h.hotelName || `гостиница ${h.hotelIndex + 1}`} — ${h.count}`
    );
    return `Группа разнесена по гостиницам: ${parts.join(", ")}`;
  }
  if (w.splitRooms) {
    return `Группа разнесена по номерам: ${w.splitRooms.join(", ")}`;
  }
  return "";
};

// Текст нарушения требования вида размещения.
// Формулировка без числительного в косвенном падеже — «4 гостей» режет глаз.
export const placementWarningText = (v) =>
  v
    ? `В номере ${v.room} гостей: ${v.occ} — требование «не более ${v.requirement}»`
    : "";
