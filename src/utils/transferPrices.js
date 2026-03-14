/**
 * Default prices for transfer (3/5/7 seater, intercity/city).
 * Used when adding a new transfer price record.
 */
export const DEFAULT_TRANSFER_PRICES = {
  threeSeater: { intercity: 0, city: 0 },
  fiveSeater: { intercity: 0, city: 0 },
  sevenSeater: { intercity: 0, city: 0 },
};

/**
 * Creates a new empty transfer price input record (for form state / API input).
 * @returns {{ prices: object, airportIds: string[], cityIds: string[] }}
 */
export function createEmptyTransferPriceInput() {
  return {
    name: '',
    prices: { ...DEFAULT_TRANSFER_PRICES },
    airportIds: [],
    cityIds: [],
  };
}

/**
 * Maps API TransferPrice (with id, airports[], cities[]) to form/input shape.
 * @param {object} tp - TransferPrice from API (id, prices, airports, cities)
 * @returns {{ id?: string, prices: object, airportIds: string[], cityIds: string[] }}
 */
export function transferPriceToInput(tp) {
  if (!tp) return createEmptyTransferPriceInput();
  return {
    ...(tp.id ? { id: tp.id } : {}),
    name: tp.name ?? '',
    prices: {
      threeSeater: tp.prices?.threeSeater ?? null,
      fiveSeater: tp.prices?.fiveSeater ?? null,
      sevenSeater: tp.prices?.sevenSeater ?? null,
    },
    airportIds: (tp.airports || []).map((a) => a.id),
    cityIds: (tp.cities || []).map((c) => c.id),
  };
}

/**
 * Plain object for route prices (no __typename) for GraphQL input.
 * @param {object} src - { intercity?, city? } possibly with __typename
 * @returns {{ intercity?: number, city?: number } | null}
 */
function toRoutePricesInput(src) {
  if (src == null) return null;
  const out = {};
  if (src.intercity != null) out.intercity = Number(src.intercity);
  if (src.city != null) out.city = Number(src.city);
  return Object.keys(out).length ? out : null;
}

/**
 * Maps form/input array to API transferPrices payload (for updateOrganization).
 * Preserves id for existing records. Strips __typename so GraphQL input accepts it.
 * @param {Array<{ id?: string, prices: object, airportIds?: string[], cityIds?: string[] }>} list
 * @returns {Array<object>}
 */
export function transferPriceInputsToPayload(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    const payload = {
      name: item.name != null ? String(item.name).trim() : '',
      prices: {
        threeSeater: toRoutePricesInput(item.prices?.threeSeater),
        fiveSeater: toRoutePricesInput(item.prices?.fiveSeater),
        sevenSeater: toRoutePricesInput(item.prices?.sevenSeater),
      },
      airportIds: item.airportIds || [],
      cityIds: item.cityIds || [],
    };
    if (item.id) payload.id = item.id;
    return payload;
  });
}
