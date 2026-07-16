/**
 * Default prices for transfer (3/5/7 seater, intercity/city).
 * Used when adding a new transfer price record.
 */
export const DEFAULT_TRANSFER_PRICES = {
  threeSeater: { intercity: null, city: null },
  fiveSeater: { intercity: null, city: null },
  sevenSeater: { intercity: null, city: null },
  twentySeater: { intercity: null, city: null },
  fiftySeater: { intercity: null, city: null },
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
      twentySeater: tp.prices?.twentySeater ?? null,
      fiftySeater: tp.prices?.fiftySeater ?? null,
    },
    airportIds: (tp.airports || []).map((a) => a.id),
    cityIds: (tp.cities || []).map((c) => c.id),
  };
}

/**
 * Plain object for route prices (no __typename) for GraphQL input.
 * Пустое/незаполненное поле уходит нулём (как в обычных ценах: parseFloat || 0).
 * @param {object} src - { intercity?, city? } possibly with __typename
 * @returns {{ intercity: number, city: number }}
 */
function toRoutePricesInput(src) {
  const num = (v) => parseFloat(v) || 0;
  return {
    intercity: num(src?.intercity),
    city: num(src?.city),
  };
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
        twentySeater: toRoutePricesInput(item.prices?.twentySeater),
        fiftySeater: toRoutePricesInput(item.prices?.fiftySeater),
      },
      airportIds: item.airportIds || [],
      cityIds: item.cityIds || [],
    };
    if (item.id) payload.id = item.id;
    return payload;
  });
}
