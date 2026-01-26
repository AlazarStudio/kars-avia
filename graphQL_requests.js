import { gql } from "@apollo/client";


// export const path = import.meta.env.VITE_PRODUCTION_PATH;
// export const server = import.meta.env.VITE_PRODUCTION_SERVER;

// export const path = import.meta.env.VITE_DEMO_PATH;
// export const server = import.meta.env.VITE_DEMO_SERVER;

export const path = import.meta.env.VITE_DEV_PATH;
export const server = import.meta.env.VITE_DEV_SERVER;


export const YMAPS_KEY = import.meta.env.VITE_YMAPS_KEY;
export const DEFAULT_CENTER = [55.755864, 37.617698]; // твой регион

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  const token = parts.pop().split(';').shift()
  return token
};

export const decodeJWT = (token) => {
  const tokenParts = token.split('.');

  if (tokenParts.length !== 3) {
    throw new Error('Invalid JWT token');
  }

  const payloadBase64 = tokenParts[1];
  const payloadDecoded = atob(payloadBase64);

  const payloadObject = JSON.parse(payloadDecoded);

  return payloadObject;
}

export const buildScheduledISO = (date, time) => {
  const d = String(date || "").trim();          // "2025-12-13"
  const t = String(time || "00:00").trim();     // "21:30"
  // строка без offset парсится как local datetime, дальше конвертим в UTC
  return new Date(`${d}T${t}:00`).toISOString(); // "YYYY-MM-DDTHH:mm:ss.sssZ"
};

const makeFormatter = (includeTime) =>
  new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime
      ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
      : {}),
  });

// const zones = Intl.supportedValuesOf("timeZone");
// console.log(zones);

export function convertToDate(dateString, includeTime = false) {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  // чтобы получить ровно "DD.MM.YYYY HH:MM" без запятой
  const parts = makeFormatter(includeTime).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));

  const base = `${p.day}.${p.month}.${p.year}`;
  return includeTime ? `${p.hour}:${p.minute}` : base;
}

// export function convertToDate(dateString, includeTime = false) {
//   const date = new Date(dateString);
//   const day = String(date.getUTCDate()).padStart(2, '0');
//   const month = String(date.getUTCMonth() + 1).padStart(2, '0');
//   const year = date.getUTCFullYear();

//   let formattedDate = `${day}.${month}.${year}`;

//   if (includeTime) {
//     const hours = String(date.getUTCHours()).padStart(2, '0');
//     const minutes = String(date.getUTCMinutes()).padStart(2, '0');
//     formattedDate = ` ${hours}:${minutes}`;
//   }

//   return formattedDate;
// }

export function generateTimestampId(min = 1, max = 1000000) {
  return Date.now() + Math.floor(Math.random() * (max - min + 1)) + min; // Возвращает количество миллисекунд с 1 января 1970 года
}

export const normalize = (s) => (s || "").trim().toLowerCase();


// текст → список адресов
export const geocodeByTextInterNational = async (text) => {
  if (!text || text.length < 3) return [];
  const url =
    `https://geocode-maps.yandex.ru/1.x/?apikey=${YMAPS_KEY}` +
    `&format=json&lang=ru_RU&results=5&geocode=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  const data = await res.json();
  const members = data.response.GeoObjectCollection.featureMember || [];

  return members.map(
    (m) =>
      m.GeoObject?.metaDataProperty?.GeocoderMetaData?.text ||
      m.GeoObject?.name
  );
};

// вспомогательная: поиск просто по России (как было раньше)
const geocodeInRussia = async (text) => {
  if (!text || text.length < 3) return [];
  const query = `Россия, ${text}`;

  const url =
    `https://geocode-maps.yandex.ru/1.x/?apikey=${YMAPS_KEY}` +
    `&format=json&lang=ru_RU&results=5` +
    `&geocode=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Yandex geocoder error", res.status);
    return [];
  }

  const data = await res.json();
  const members = data.response?.GeoObjectCollection?.featureMember || [];

  return members.map(
    (m) =>
      m.GeoObject?.metaDataProperty?.GeocoderMetaData?.text ||
      m.GeoObject?.name
  );
};

// конвертация км → градусы
const getSpanForRadiusKm = (radiusKm, lat) => {
  const latDegPerKm = 1 / 111; // ~111 км в 1° широты
  const lonDegPerKm = 1 / (111 * Math.cos((lat * Math.PI) / 180)); // зависит от широты :contentReference[oaicite:1]{index=1}

  // spn — это полная "ширина/высота" окна, не радиус
  const spanLat = radiusKm * latDegPerKm * 2;
  const spanLon = radiusKm * lonDegPerKm * 2;
  return { spanLat, spanLon };
};


// Текст → список адресов, ограничено РФ
// export const geocodeByTextRU = async (text) => {
//   if (!text || text.length < 3) return [];

//   // ВАЖНО: добавляем "Россия" перед текстом
//   const query = `Россия, ${text}`;

//   const url =
//     `https://geocode-maps.yandex.ru/1.x/?apikey=${YMAPS_KEY}` +
//     `&format=json` +
//     `&lang=ru_RU` +
//     `&results=5` +
//     `&geocode=${encodeURIComponent(query)}`;

//   const res = await fetch(url);
//   if (!res.ok) {
//     console.error("Yandex geocoder error", res.status);
//     return [];
//   }

//   const data = await res.json();
//   const members = data.response?.GeoObjectCollection?.featureMember || [];

//   return members.map(
//     (m) =>
//       m.GeoObject?.metaDataProperty?.GeocoderMetaData?.text ||
//       m.GeoObject?.name
//   );
// };

// основной геопоиск с расширением области
export const geocodeByTextRU = async (text, options = {}) => {
  const {
    center,           // [lat, lon]
    initialRadiusKm = 20,
    maxRadiusKm = 80,
    stepKm = 20,
  } = options || {};

  if (!text || text.length < 3) return [];

  // если центр не задан — старое поведение: поиск по РФ
  if (!center) {
    return geocodeInRussia(text);
  }

  const [lat, lon] = center; // внимание: в ll нужно lon,lat!

  let radiusKm = initialRadiusKm;

  while (radiusKm <= maxRadiusKm) {
    const { spanLat, spanLon } = getSpanForRadiusKm(radiusKm, lat);

    const url =
      `https://geocode-maps.yandex.ru/1.x/?apikey=${YMAPS_KEY}` +
      `&format=json&lang=ru_RU&results=5` +
      `&ll=${lon},${lat}` +              // центр области
      `&spn=${spanLon},${spanLat}` +     // ширина/высота области
      `&rspn=1` +                        // жёстко не вылезать за область :contentReference[oaicite:2]{index=2}
      `&geocode=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error("Yandex geocoder error", res.status);
      break;
    }

    const data = await res.json();
    const members = data.response?.GeoObjectCollection?.featureMember || [];

    if (members.length) {
      return members.map(
        (m) =>
          m.GeoObject?.metaDataProperty?.GeocoderMetaData?.text ||
          m.GeoObject?.name
      );
    }

    // ничего не нашли — увеличиваем радиус
    radiusKm += stepKm;
  }

  // вообще ничего не нашли поблизости — пробуем общий поиск по России
  return geocodeInRussia(text);
};

// координаты → один адрес
/**
 * Обратный геокодинг координат в адрес
 * Приоритет: адрес дома (улица + номер) > улица > топоним/POI
 * 
 * Проблема с POI: при клике на объект (ЦУМ, храм и т.д.) API возвращает
 * первым результатом сам POI с его названием, а не адрес дома рядом.
 * Решение: запрашиваем больше результатов (results=10) и ищем среди них
 * объект типа "house" с номером дома.
 * 
 * @param {[number, number]} coords - [lat, lon]
 * @returns {Promise<string>} - адрес или пустая строка
 */
/**
 * ДИАГНОСТИКА: Старая версия через HTTP API (может блокироваться CORS)
 * Оставлена для диагностики. Используйте reverseGeocodeByCoordsWithYmaps вместо этого.
 */
export const reverseGeocodeByCoords = async ([lat, lon]) => {
  // Важно: координаты в формате lon,lat для Yandex API
  const url =
    `https://geocode-maps.yandex.ru/1.x/?apikey=${YMAPS_KEY}` +
    `&format=json` +
    `&lang=ru_RU` +
    `&geocode=${lon},${lat}` +
    `&results=10`;

  try {
    const res = await fetch(url);
    
    // ДИАГНОСТИКА: логируем статус и ответ
    const responseText = await res.text();
    console.log("🔍 DIAGNOSTIC: reverseGeocodeByCoords HTTP response");
    console.log("Status:", res.status);
    console.log("Response:", responseText.substring(0, 500)); // первые 500 символов
    
    if (!res.ok) {
      console.error("❌ Yandex reverseGeocode HTTP error", res.status);
      console.error("Response body:", responseText);
      return "";
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("❌ Failed to parse JSON:", parseErr);
      console.error("Response was:", responseText);
      return "";
    }

    const members = data.response?.GeoObjectCollection?.featureMember || [];
    console.log("📦 Found", members.length, "results");

    if (members.length === 0) {
      console.warn("⚠️ No results from geocoder");
      return "";
    }

    // Шаг 1: Ищем адрес дома (kind=house) с номером дома
    for (const member of members) {
      const geoObject = member?.GeoObject;
      if (!geoObject) continue;

      const metaData = geoObject?.metaDataProperty?.GeocoderMetaData;
      const kind = metaData?.kind;
      const address = metaData?.Address;
      
      // Проверяем, что это дом и есть номер дома
      if (kind === "house") {
        const houseComponent = address?.Components?.find(
          (c) => c.kind === "house"
        );
        
        if (houseComponent?.name) {
          // Используем formatted адрес (полный адрес), если есть
          // Иначе используем text (тоже полный адрес, но может быть менее структурирован)
          const formatted = address?.formatted || metaData?.text;
          if (formatted) {
            return formatted;
          }
        }
      }
    }

    // Шаг 2: Если нет дома с номером, ищем любой дом (без номера)
    for (const member of members) {
      const geoObject = member?.GeoObject;
      if (!geoObject) continue;

      const metaData = geoObject?.metaDataProperty?.GeocoderMetaData;
      const kind = metaData?.kind;
      
      if (kind === "house") {
        const formatted = metaData?.Address?.formatted || metaData?.text;
        if (formatted) {
          return formatted;
        }
      }
    }

    // Шаг 3: Ищем улицу (kind=street)
    for (const member of members) {
      const geoObject = member?.GeoObject;
      if (!geoObject) continue;

      const metaData = geoObject?.metaDataProperty?.GeocoderMetaData;
      const kind = metaData?.kind;
      
      if (kind === "street") {
        const formatted = metaData?.Address?.formatted || metaData?.text;
        if (formatted) {
          return `≈ ${formatted}`; // Помечаем как приблизительный
        }
      }
    }

    // Шаг 4: Если ничего не нашли, берем первый результат (может быть POI или топоним)
    // но используем formatted адрес, если он есть
    const firstMember = members[0]?.GeoObject;
    if (firstMember) {
      const metaData = firstMember?.metaDataProperty?.GeocoderMetaData;
      const formatted = metaData?.Address?.formatted ||
                       metaData?.text ||
                       firstMember?.name;
      
      if (formatted) {
        // Если это не дом и не улица, помечаем как приблизительный
        const kind = metaData?.kind;
        if (kind !== "house" && kind !== "street") {
          return `≈ ${formatted}`;
        }
        return formatted;
      }
    }

    return "";
  } catch (err) {
    console.error("❌ Error in reverseGeocodeByCoords:", err);
    // Если это CORS ошибка
    if (err.message?.includes("CORS") || err.message?.includes("Failed to fetch")) {
      console.error("🚫 CORS blocked! Use reverseGeocodeByCoordsWithYmaps instead.");
    }
    return "";
  }
};

/**
 * ОСНОВНОЕ РЕШЕНИЕ: Обратный геокодинг через JS API Яндекс.Карт
 * Работает без проблем с CORS, так как использует уже загруженный ymaps.
 * 
 * @param {object} ymaps - экземпляр ymaps из @pbe/react-yandex-maps
 * @param {[number, number]} coords - [lat, lon] (в JS API порядок lat,lon)
 * @returns {Promise<string>} - адрес или пустая строка
 */
export const reverseGeocodeByCoordsWithYmaps = async (ymaps, coords) => {
  if (!ymaps || typeof ymaps.geocode !== "function") return "";

  const pick = (geoObjects) => {
    const count = geoObjects.getLength();
    if (!count) return "";

    // пробуем найти результат с домом/номером
    for (let i = 0; i < count; i++) {
      const obj = geoObjects.get(i);
      const md = obj.properties.get("metaDataProperty")?.GeocoderMetaData;
      const kind = md?.kind;
      const comps = md?.Address?.Components || [];
      const hasHouse = comps.some((c) => c.kind === "house" && c.name);
      if (kind === "house" || hasHouse) {
        const line = obj.getAddressLine();
        if (line) return line;
      }
    }

    // иначе — что есть (улица/площадь/район/POI), помечаем как приблизительно
    const line = geoObjects.get(0).getAddressLine();
    return line ? `≈ ${line}` : "";
  };

  // 1) сначала просим именно "house"
  const resHouse = await ymaps.geocode(coords, { kind: "house", results: 10 });
  const a1 = pick(resHouse.geoObjects);
  if (a1 && !a1.startsWith("≈")) return a1; // нашли “нормальный” дом

  // 2) иначе — общий поиск (улица/площадь/POI)
  const resAny = await ymaps.geocode(coords, { results: 10 });
  return pick(resAny.geoObjects);
};


/**
 * АЛЬТЕРНАТИВНОЕ РЕШЕНИЕ (B): Обратный геокодинг через backend прокси
 * Используйте, если по каким-то причинам JS API не подходит.
 * 
 * Backend endpoint (Express.js пример):
 * 
 * app.get('/api/geocode/reverse', async (req, res) => {
 *   const { lat, lon } = req.query;
 *   if (!lat || !lon) {
 *     return res.status(400).json({ error: 'lat and lon required' });
 *   }
 * 
 *   try {
 *     const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YMAPS_KEY}` +
 *                 `&format=json&lang=ru_RU&geocode=${lon},${lat}&results=10`;
 *     const response = await fetch(url);
 *     const data = await response.json();
 *     
 *     // Та же логика поиска дома, что и в reverseGeocodeByCoords
 *     const members = data.response?.GeoObjectCollection?.featureMember || [];
 *     // ... поиск дома/улицы ...
 *     
 *     res.json({ address: foundAddress });
 *   } catch (err) {
 *     res.status(500).json({ error: err.message });
 *   }
 * });
 * 
 * Frontend вызов:
 * 
 * export const reverseGeocodeByCoordsViaBackend = async ([lat, lon]) => {
 *   try {
 *     const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
 *     const data = await res.json();
 *     return data.address || "";
 *   } catch (err) {
 *     console.error("Error:", err);
 *     return "";
 *   }
 * };
 */

// вспомогалка: геокодируем строку в [lat, lon]
export const geocodeAddressToCoords = async (text) => {
  if (!text || text.length < 3) return null;

  const url =
    `https://geocode-maps.yandex.ru/1.x/?apikey=${YMAPS_KEY}` +
    `&format=json&lang=ru_RU&geocode=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Yandex geocodeAddressToCoords error", res.status);
    return null;
  }

  const data = await res.json();
  const member =
    data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;

  const pointStr = member?.Point?.pos; // "lon lat"
  if (!pointStr) return null;

  const [lon, lat] = pointStr.split(" ").map(Number);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  return [lat, lon]; // [lat, lon]
};


// ----------------------------------------------------------------


// TRANSFER

export const TRANSFER_SING_IN = gql`
  mutation TransferSignIn($input: TransferSignInInput!) {
    transferSignIn(input: $input) {
      token
    }
  }
`;

export const GET_MESSAGES_TRANSFER = gql`
  query Chats($requestId: ID, $reserveId: ID) {
    chats(requestId: $requestId, reserveId: $reserveId) {
      id
      separator
      hotelId
      hotel {
        name
      }
      airlineId
      unreadMessagesCount
      messages {
        id
        separator
        text
        createdAt
        sender {
          id
          name
          role
          position {
            id
            name
          }
        }
        readBy {
          user {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_TRANSFER_REQUESTS = gql`
  query Transfers($pagination: TransferPaginationInput!) {
    transfers(pagination: $pagination) {
      totalPages
      totalCount
      transfers {
        id
        fromAddress
        toAddress
        persons {
          id
          email
          name
        }
        airlineId
        status
        createdAt
        scheduledPickupAt
        description
        driverAssignmentAt
        orderAcceptanceAt
        arrivedToPassengerAt
        departedAt
        finishedAt
        driver {
          id
          name
          rating
          car
          vehicleNumber
          location {
            lat
            lng
          }
          organization {
            name
          }
          transfers {
            id
            fromAddress
            toAddress
            status
          }
        }
      }
    }
  }
`;

export const GET_TRANSFER_REQUEST = gql`
query Transfer($transferId: ID!) {
  transfer(id: $transferId) {
        id
        fromAddress
        baggage
        toAddress
        persons {
          id
          email
          name
          images
        }
        airlineId
        status
        createdAt
        scheduledPickupAt
        description
        driverAssignmentAt
        orderAcceptanceAt
        arrivedToPassengerAt
        departedAt
        finishedAt
        driver {
          id
          name
          rating
          car
          vehicleNumber
          location {
            lat
            lng
          }
          organization {
            name
          }
          transfers {
            id
            fromAddress
            toAddress
            status
          }
        }
    
  }
}
`;

export const CREATE_TRANSFER_REQUEST_MUTATION = gql`
  mutation CreateTransfer($input: TransferInput!) {
    createTransfer(input: $input) {
      createdAt
      fromAddress
    }
  }
`;

export const UPDATE_TRANSFER_REQUEST_MUTATION = gql`
  mutation UpdateTransfer($updateTransferId: ID!, $input: TransferUpdateInput!) {
    updateTransfer(id: $updateTransferId, input: $input) {
      id
    }
  }
`;

export const DRIVERS_QUERY = gql`
  query Drivers($pagination: DriverPaginationInput!) {
    drivers(pagination: $pagination) {
      totalCount
      totalPages
      drivers {
        id
        name
        registrationStatus
        car
        location {
          lat
          lng
        }
        vehicleNumber
        createdAt
        email
        extraEquipment
        organizationId
        organization {
          name
        }
        organizationConfirmed
        number
        rating
        driverLicenseNumber
        active
        online
        documents {
          carPhotos
          driverPhoto
          licensePhoto
          osagoPhoto
          ptsPhoto
          stsPhoto
        }
        transfers {
          id
          fromAddress
          toAddress
          status
        }
      }
    }
  }
`;

export const CREATE_DRIVER_MUTATION = gql`
  mutation CreateDriver($input: DriverCreateInput!) {
    createDriver(input: $input) {
      id
    }
  }
`;

export const UPDATE_DRIVER_WITH_PHOTO_MUTATION = gql`
  mutation UpdateDriver($updateDriverId: ID!, $driverPhoto: [Upload], $input: DriverUpdateInput, $carPhotos: [Upload], $stsPhoto: [Upload], $ptsPhoto: [Upload], $osagoPhoto: [Upload], $licensePhoto: [Upload]) {
    updateDriver(id: $updateDriverId, driverPhoto: $driverPhoto, input: $input, carPhotos: $carPhotos, stsPhoto: $stsPhoto, ptsPhoto: $ptsPhoto, osagoPhoto: $osagoPhoto, licensePhoto: $licensePhoto) {
      documents {
        carPhotos
        driverPhoto
        licensePhoto
        osagoPhoto
        ptsPhoto
        stsPhoto
      }
    }
  }
`;

export const UPDATE_DRIVER_MUTATION = gql`
  mutation UpdateDriver($updateDriverId: ID!, $input: DriverUpdateInput) {
    updateDriver(id: $updateDriverId, input: $input) {
      car
      email
      name
      number
      organization {
        name
      }
      rating
      vehicleNumber
      registrationStatus
      driverLicenseNumber
      documents {
        driverPhoto
      }
    }
  }
`;

export const GET_ORGANIZATIONS = gql`
  query Organizations($pagination: OrganizationPaginationInput) {
    organizations(pagination: $pagination) {
      totalCount
      totalPages
      organizations {
        id
        name
        images
        information {
          country
          city
        }
      }
    }
  }
`;

export const GET_ORGANIZATION = gql`
  query Organization($organizationId: ID!) {
    organization(id: $organizationId) {
      id
      images
      information {
        country
        city
        address
        index
        email
        number
        inn
        ogrn
        rs
        bank
        bik
        link
        description
      }
      name
      drivers {
          id
          name
          registrationStatus
          car
          location {
            lat
            lng
          }
          organization {
            name
          }
          vehicleNumber
          createdAt
          email
          extraEquipment
          organizationConfirmed
          number
          rating
          driverLicenseNumber
          active
          online
          documents {
            carPhotos
            driverPhoto
            licensePhoto
            osagoPhoto
            ptsPhoto
            stsPhoto
          }
          transfers {
            id
            fromAddress
            toAddress
            status
          }
      }
    }
  }
`;

export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($input: OrganizationInput, $images: [Upload!]) {
    createOrganization(input: $input, images: $images) {
      id
      name
    }
  }
`;

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($updateOrganizationId: ID!, $input: UpdateOrganizationInput, $images: [Upload!]) {
    updateOrganization(id: $updateOrganizationId, input: $input, images: $images) {
      id
    }
  }
`;

export const GET_ORGANIZATION_CONTRACTS = gql`
  query OrganizationContracts($pagination: ContractPaginationInput, $filter: OrganizationContractFilter) {
    organizationContracts(pagination: $pagination, filter: $filter) {
      totalPages
      totalCount
      items {
        id
        companyId
        organizationId
        company {
          name
        }
        organization {
          id
          name
          images
        }
        cityId
        region {
          id
          city
          region
        }
        date
        contractNumber
        notes
        applicationType
        files
      }
    }
  }
`;

export const GET_ORGANIZATION_CONTRACT = gql`
  query OrganizationContract($organizationContractId: ID!) {
    organizationContract(id: $organizationContractId) {
      id
      companyId
      organizationId
      company {
        name
      }
      organization {
        id
        name
        images
      }
      cityId
      region {
        id
        city
        region
      }
      date
      contractNumber
      notes
      applicationType
      files
      additionalAgreements {
        id
        itemAgreement
        date
        contractNumber
        files
        notes
        organizationContractId
      }
    }
  }
`;

export const CREATE_ORGANIZATION_CONTRACT = gql`
  mutation CreateOrganizationContract($input: OrganizationContractCreateInput!, $files: [Upload!]) {
    createOrganizationContract(input: $input, files: $files) {
      id
    }
  }
`;

export const UPDATE_ORGANIZATION_CONTRACT = gql`
  mutation UpdateOrganizationContract($updateOrganizationContractId: ID!, $input: OrganizationContractUpdateInput!, $files: [Upload!]) {
    updateOrganizationContract(id: $updateOrganizationContractId, input: $input, files: $files) {
      id
    }
  }
`;

export const DELETE_ORGANIZATION_CONTRACT = gql`
  mutation DeleteOrganizationContract($deleteOrganizationContractId: ID!) {
    deleteOrganizationContract(id: $deleteOrganizationContractId)
  }
`;

export const TRANSFER_CREATED_SUBSCRIPTION = gql`
  subscription TransferCreated {
    transferCreated {
      id
      status
      fromAddress
    }
  }
`;

export const TRANSFER_UPDATED_SUBSCRIPTION = gql`
  subscription TransferUpdated {
    transferUpdated {
      id
      status
      driverAssignmentAt
    }
  }
`;

export const ORGANIZATION_CREATED_SUBSCRIPTION = gql`
  subscription OrganizationCreated {
    organizationCreated {
      id
    }
  }
`;

export const SUBSCRIPTION_ORGANIZATION_CONTRACTS = gql`
  subscription ContractOrganization {
    contractOrganization {
      id
    }
  }
`;

export const DRIVER_UPDATED_SUBSCRIPTION = gql`
  subscription DriverUpdated {
    driverUpdated {
      id
    }
  }
`;

// TRANSFER


// Запросы получения пользователя

export const SINGIN = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      token
      refreshToken
    }
  }
`;


export const SINGUP = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      token
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!, $fingerprint: String!) {
    refreshToken(refreshToken: $refreshToken, fingerprint: $fingerprint) {
      token
      refreshToken
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout {
      message
    }
  }
`;

// Запросы получения пользователя

// Запросы на сброс пароля

export const REQUEST_RESET_PASSWORD = gql`
  mutation RequestResetPassword($email: String!) {
    requestResetPassword(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

// Запросы на сброс пароля

// ----------------------------------------------------------------

//
export const GET_ALL_POSITIONS = gql`
  query getAllPositions {
    getAllPositions {
      id
      name
    }
  }
`;

export const GET_AIRLINE_USERS_POSITIONS = gql`
  query GetAirlineUserPositions {
    getAirlineUserPositions {
      id
      name
      separator
    }
  }
`;

export const GET_AIRLINE_POSITIONS = gql`
  query GetAirlinePositions {
    getAirlinePositions {
      id
      name
      separator
      category
    }
  }
`;

export const GET_HOTEL_POSITIONS = gql`
  query GetHotelPositions {
    getHotelPositions {
      id
      name
      separator
    }
  }
`;

export const GET_DISPATCHER_POSITIONS = gql`
  query GetDispatcherPositions {
    getDispatcherPositions {
      id
      name
      separator
      category
    }
  }
`;
//

// Запросы к заявкам на эстафету

export const GET_REQUESTS = gql`
  query Requests($pagination: PaginationInput) {
    requests(pagination: $pagination) {
      totalCount
      totalPages
      requests {
        id
        airportId
        airport {
          id
          name
          city
          code
        }
        arrival
        departure
        roomCategory
        mealPlan {
          included
          breakfast
          lunch
          dinner
        }
        senderId
        receiverId
        createdAt
        updatedAt
        hotelId
        roomNumber
        status
        person {
          id
          name
          number
          position {
            id
            name
          }
          gender
        }
        airline {
          id
          name
          images
        }
        reserve
        requestNumber
        chat {
          unreadMessagesCount
          airlineId
          hotelId
        }
      }
    }
}

`;

export const GET_REQUESTS_ARCHIVED = gql`
  query RequestArchive($pagination: PaginationInput) {
    requestArchive(pagination: $pagination) {
      totalCount
        totalPages
        requests {
          id
          airportId
          airport {
            id
            name
            city
            code
          }
          arrival
          departure
          roomCategory
          mealPlan {
            included
            breakfast
            lunch
            dinner
          }
          senderId
          receiverId
          createdAt
          updatedAt
          hotelId
          roomNumber
          status
          person {
            id
            name
            number
            position {
              id
              name
            }
            gender
          }
          airline {
            name
            images
          }
          requestNumber
        }
    }
  }
`;

export const REQUEST_CREATED_SUBSCRIPTION = gql`
    subscription RequestCreated {
        requestCreated {
          id
          airportId
          airport {
            id
            name
            city
            code
          }
          arrival
          departure
          roomCategory
          mealPlan {
            included
            breakfast
            lunch
            dinner
          }
          senderId
          receiverId
          createdAt
          updatedAt
          hotelId
          roomNumber
          status
          person {
            id
            name
            number
            position {
              id
              name
            }
            gender
          }
          airline {
            name
            images
          }
          requestNumber
          hotelChess {
            start
            end
            room {
              id
              name
              category
              places
              active
              reserve
              description
              descriptionSecond
              images
            }
            id
            place
          }
        }
    }
`;

export const REQUEST_UPDATED_SUBSCRIPTION = gql`
    subscription requestUpdated {
        requestUpdated {
          id
          airportId
          airport {
            id
            name
            city
            code
          }
          arrival
          departure
          roomCategory
          mealPlan {
            included
            breakfast
            lunch
            dinner
            dailyMeals {
              breakfast
              date
              dinner
              lunch
            }
          }
          senderId
          receiverId
          createdAt
          updatedAt
          hotelId
          roomNumber
          status
          person {
            id
            name
            number
            position {
              id
              name
            }
            gender
          }
          airline {
            name
            images
          }
          requestNumber
          hotelChess {
            start
            end
            room {
              id
              name
              category
              places
              active
              reserve
              description
              descriptionSecond
              images
            }
            id
            place
          }
        }
    }
`;

export const REQUEST_MESSAGES_SUBSCRIPTION = gql`
  subscription($chatId: ID!) {
    messageSent(chatId: $chatId) {
      id
      text
      sender {
        id
        name
        role
        position {
          id
          name
        }
      }
      createdAt
    }
  }
`;

export const QUERY_NOTIFICATIONS = gql`
  query Notifications($pagination: PaginationInput) {
    getAllNotifications(pagination: $pagination) {
      notifications {
        id
        createdAt
        requestId
        reserveId
        description {
          action
          description
          reason
        }
        request {
          requestNumber
          person {
            id
            name
          }
        }
        reserve {
          reserveNumber
        }
        readBy {
          id
          user {
            id
            name
          }
          readAt
        }
        chatId
      }
      totalCount
      totalPages
    }
  }
`;

export const NOTIFICATIONS_SUBSCRIPTION = gql`
  subscription Notifications {
    notification {
      ... on ExtendRequestNotification {
        requestId
        newStart
        newEnd
        airline {
          name
        }
      }
      ... on RequestCreatedNotification {
        requestId
        arrival
        departure
        airline {
          name
        }
      }
      ... on ReserveCreatedNotification {
        reserveId
        arrival
        departure
        airline {
          name
        }
      }
      ... on ReserveUpdatedNotification {
        reserveId
        arrival
        departure
        airline {
          name
        }
      }
      ... on MessageSentNotification {
        chat {
          id
        }
        text
      }
    }
  }
`;

export const CREATE_REQUEST_MUTATION = gql`
    mutation CreateRequest($input: CreateRequestInput!) {
        createRequest(input: $input) {
          id
          airportId
          airport {
            id
            name
            city
            code
          }
          arrival
          departure
          roomCategory
          mealPlan {
            included
            breakfast
            lunch
            dinner
          }
          senderId
          receiverId
          createdAt
          updatedAt
          hotelId
          roomNumber
          status
          person {
            id
            name
            number
            position {
              id
              name
            }
            gender
          }
          airline {
            name
            images
          }
          reserve
        }
    }
`;

export const CREATE_PASSENGER_REQUEST = gql`
  mutation CreatePassengerRequest($input: PassengerRequestCreateInput!) {
    createPassengerRequest(input: $input) {
      flightNumber
    }
  }
`;

export const GET_AIRLINES_RELAY = gql` 
query Airlines { 
  airlines(pagination: {all: true}) { 
    airlines { 
      id 
      name 
      images
      staff { 
        id 
        name 
        position {
          id
          name
        }
        gender 
        number 
      } 
    } 
  } 
} 
`;

export const GET_AIRPORTS_RELAY = gql`
  query Airports {
    airports {
      id
      name
      city
      code
    }
  }
`;

export const GET_CITIES = gql`
  query Citys {
    citys {
      id
      city
      region
    }
  }
`;

export const GET_HOTELS_RELAY = gql`
  query Hotels {
    hotels(pagination: {all: true}) {
      hotels {
        id
        name
        images
        information {
          city
        }
        airport {
          id
          name
          city
          code
        }
      }
    }
  }
`;

export const GET_REQUEST = gql`
  query Query($pagination: LogPaginationInput, $requestId: ID) {
    request(id: $requestId) {
      id
      airportId
      airport {
        id
        name
        city
        code
      }
      arrival
      departure
      roomCategory
      mealPlan {
        included
        breakfast
        lunch
        dinner
        dailyMeals {
          breakfast
          date
          dinner
          lunch
        }
      }
      senderId
      receiverId
      createdAt
      updatedAt
      hotelId
      roomNumber
      status
      logs(pagination: $pagination) {
        logs {
          id
          action
          description
          oldData
          newData
          createdAt
          user {
            name
            role
          }
        }
        totalCount
        totalPages
      }
      person {
        id
        name
        number
        position {
          id
          name
        }
        gender
      }
      airline {
        id
        name
        images
      }
      requestNumber
      hotel {
        id
        name
      }
      hotelChess {
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
        place
      }
      chat {
        unreadMessagesCount
        airlineId
        hotelId
      }
    }
  }
`;

export const CANCEL_REQUEST = gql`
  mutation CancelRequest($cancelRequestId: ID!) {
    cancelRequest(id: $cancelRequestId) {
      id
      status
    }
  }
`;

export const UPDATE_HOTEL_BRON = gql`
  mutation Mutation($updateHotelId: ID!, $input: UpdateHotelInput!) {
    updateHotel(id: $updateHotelId, input: $input) {
      id
      hotelChesses {
        id
        hotelId
        public
        start
        end
        clientId
        requestId
        place
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
      }
    }
  }
`;

export const UPDATE_REQUEST_RELAY = gql`
  mutation Mutation($updateRequestId: ID!, $input: UpdateRequestInput!) {
    updateRequest(id: $updateRequestId, input: $input) {
      status
    }
  }
`;

export const UPDATE_PASSENGER_REQUEST = gql`
  mutation UpdatePassengerRequest($updatePassengerRequestId: ID!, $input: PassengerRequestUpdateInput!) {
    updatePassengerRequest(id: $updatePassengerRequestId, input: $input) {
      id
    }
  }
`;

export const GET_BRONS_HOTEL = gql`
  query Hotel($hotelId: ID!, $hcPagination: HotelChessPaginationInput) {
    hotel(id: $hotelId) {
      name
      hotelChesses(hcPagination: $hcPagination) {
        id
        status
        public
        start
        end
        place
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
        client {
          id
          name
          number
          position {
            id
            name
          }
          gender
        }
        passenger {
          id
          name
          number
          gender
        }
        request {
          id
          airport {
            city
            code
            name
          }
          arrival
          departure
          mealPlan {
            included
            breakfast
            lunch
            dinner
          }
          airline {
            name
            images
          }
          status
          requestNumber
        }
        reserve {
          id
          airport {
            city
            code
            name
          }
          arrival
          departure
          mealPlan {
            included
            breakfast
            lunch
            dinner
          }
          airline {
            name
            images
          }
          status
          reserveNumber
        }
      }
    }
  }
`;

export const GET_MESSAGES_HOTEL = gql`
  query Chats($requestId: ID, $reserveId: ID) {
    chats(requestId: $requestId, reserveId: $reserveId) {
      id
      separator
      hotelId
      hotel {
        name
      }
      airlineId
      unreadMessagesCount
      messages {
        id
        separator
        text
        createdAt
        sender {
          id
          name
          role
          position {
            id
            name
          }
        }
        readBy {
          user {
            id
            name
          }
        }
      }
    }
  }
`;

export const NEW_UNREAD_MESSAGE_SUBSCRIPTION = gql`
  subscription NewUnreadMessage($userId: ID!) {
    newUnreadMessage(userId: $userId) {
      id
    }
  }
`;

export const MESSAGE_SENT_SUBSCRIPTION = gql`
  subscription MessageSent {
    messageSent {
      id
    }
  }
`;

export const MARK_MESSAGE_AS_READ = gql`
  mutation markMessageAsRead($messageId: ID!, $userId: ID!) {
    markMessageAsRead(messageId: $messageId, userId: $userId) {
      id
      message {
        text
        sender {
          name
        }
      }
      user {
        name
      }
      readAt
    }
  }
`;

export const MARK_ALL_MESSAGES_AS_READ = gql`
  mutation MarkAllMessagesAsRead($chatId: ID!, $userId: ID!) {
    markAllMessagesAsRead(chatId: $chatId, userId: $userId)
  }
`;

export const UPDATE_MESSAGE_BRON = gql`
  mutation ($chatId: ID!, $senderId: ID!, $text: String!) {
    sendMessage(chatId: $chatId, senderId: $senderId, text: $text) {
      id
      text
      sender {
        id
        name
        role
      }
      createdAt
    }
  }
`;

// Transfer Chat Queries
export const GET_TRANSFER_CHATS = gql`
  query GetTransferChats($transferId: ID!) {
    transferChats(transferId: $transferId) {
      id
      type
      createdAt
      dispatcher {
        id
        name
        email
      }
      driver {
        id
        name
      }
      personal {
        id
        name
      }
    }
  }
`;

export const GET_TRANSFER_MESSAGES = gql`
  query GetTransferMessages($chatId: ID!) {
    transferMessages(chatId: $chatId) {
      id
      text
      createdAt
      isRead
      authorType
      chatId
      senderUser {
        id
        name
        images
      }
      senderDriver {
        id
        name
      }
      senderPersonal {
        id
        name
      }
      readBy {
        id
        readerType
        readAt
        user {
          id
          name
        }
        driver {
          id
          name
        }
        personal {
          id
          name
        }
      }
    }
  }
`;

export const GET_TRANSFER_CHAT_BY_TYPE = gql`
  query GetTransferChatByType($transferId: ID!, $type: TransferChatType!, $personalId: ID) {
    transferChatByType(transferId: $transferId, type: $type, personalId: $personalId) {
      id
      type
      createdAt
      dispatcher {
        id
        name
      }
      driver {
        id
        name
      }
      personal {
        id
        name
      }
      messages {
        id
        text
        createdAt
        authorType
        senderUser {
          id
          name
        }
        senderDriver {
          id
          name
        }
        senderPersonal {
          id
          name
        }
      }
    }
  }
`;

// Transfer Chat Mutations
export const SEND_TRANSFER_MESSAGE = gql`
  mutation SendTransferMessage($input: SendTransferMessageInput!) {
    sendTransferMessage(input: $input) {
      id
      text
      createdAt
      isRead
      authorType
      chatId
      senderUser {
        id
        name
      }
      senderDriver {
        id
        name
      }
      senderPersonal {
        id
        name
      }
    }
  }
`;

export const MARK_TRANSFER_MESSAGE_AS_READ = gql`
  mutation MarkTransferMessageAsRead($input: MarkTransferMessageReadInput!) {
    markTransferMessageAsRead(input: $input) {
      id
      readAt
      readerType
      message {
        id
        text
      }
      user {
        id
        name
      }
      driver {
        id
        name
      }
      personal {
        id
        name
      }
    }
  }
`;

export const MARK_ALL_TRANSFER_MESSAGES_AS_READ = gql`
  mutation MarkAllTransferMessagesAsRead(
    $chatId: ID!
    $readerType: ActorType!
    $userId: ID
    $driverId: ID
    $personalId: ID
  ) {
    markAllTransferMessagesAsRead(
      chatId: $chatId
      readerType: $readerType
      userId: $userId
      driverId: $driverId
      personalId: $personalId
    )
  }
`;

// Transfer Chat Subscriptions
export const TRANSFER_MESSAGE_SENT_SUBSCRIPTION = gql`
  subscription TransferMessageSent($transferId: ID!) {
    transferMessageSent(transferId: $transferId) {
      id
      text
      createdAt
      isRead
      authorType
      chatId
      senderUser {
        id
        name
        images
      }
      senderDriver {
        id
        name
      }
      senderPersonal {
        id
        name
      }
      readBy {
        id
        readerType
        readAt
      }
    }
  }
`;

export const TRANSFER_MESSAGE_READ_SUBSCRIPTION = gql`
  subscription TransferMessageRead($chatId: ID!) {
    transferMessageRead(chatId: $chatId) {
      id
      readAt
      readerType
      message {
        id
        text
        chatId
      }
      user {
        id
        name
      }
      driver {
        id
        name
      }
      personal {
        id
        name
      }
    }
  }
`;

export const GET_USER_BRONS = gql`
  query AirlineStaff($airlineStaffId: ID!) {
    airlineStaff(id: $airlineStaffId) {
      hotelChess {
        start
        end
        hotel {
          name
        }
      }
    }
  }
`;

export const GET_LOGS = gql`
  query Query($requestId: ID) {
    request(id: $requestId) {
      logs {
        id
        action
        description
        oldData
        newData
        createdAt
        user {
          name
          role
        }
      }
      person {
        name
        position {
          id
          name
        }
      }
      airport {
        name
      }
      id
      arrival
      hotel {
        name
      }
    }
  }
`;

export const GET_HOTEL_LOGS = gql`
  query Hotel($pagination: LogPaginationInput, $hotelId: ID!) {
    hotel(id: $hotelId) {
      id
      name
      logs(pagination: $pagination) {
        totalCount
        totalPages
        logs {
          createdAt
          id
          description
          action
          oldData
          newData
          user {
            name
            role
          }
        }
      }
    }
  }
`;

export const GET_AIRLINE_LOGS = gql`
  query Airline($pagination: LogPaginationInput, $airlineId: ID!) {
    airline(id: $airlineId) {
      id
      name
      logs(pagination: $pagination) {
        totalCount
        totalPages
        logs {
          id
          description
          createdAt
          action
          newData
          oldData
          user {
            name
            role
          }
        }
      }
    }
  }
`;

export const GET_RESERVE_LOGS = gql`
  query Reserve($reserveId: ID!, $pagination: LogPaginationInput) {
    reserve(id: $reserveId) {
      logs(pagination: $pagination) {
        logs {
          id
          newData
          oldData
          description
          createdAt
          action
          user {
            name
            role
          }
        }
      }
    }
  }
`;

export const SAVE_MEALS_MUTATION = gql`
  mutation ModifyDailyMeals($input: ModifyDailyMealsInput!) {
    modifyDailyMeals(input: $input) {
      included
      breakfast
      lunch
      dinner
      dailyMeals {
        date
        breakfast
        lunch
        dinner
      }
    }
  }
`;

export const SAVE_HANDLE_EXTEND_MUTATION = gql`
  mutation ExtendRequestDates($input: ExtendRequestDatesInput!) {
    extendRequestDates(input: $input) {
      arrival
      departure
      hotelChess {
        start
        end
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
        }
      }
      mealPlan {
        included
        breakfast
        lunch
        dinner
        dailyMeals {
          date
          breakfast
          lunch
          dinner
        }
      }
    }
  }
`;

export const EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION = gql`
  subscription Notification {
    notification {
      ... on ExtendRequestNotification {
        requestId
        newStart
        newEnd
        dispatcherId
      }
    }
  }
`;

export const CHANGE_TO_ARCHIVE = gql`
  mutation Mutation($archivingRequstId: ID!) {
    archivingRequest(id: $archivingRequstId) {
      id
    }
  }
`;


// Запросы к заявкам на эстафету

// ----------------------------------------------------------------

// Запросы к заявкам на резерв

export const CREATE_REQUEST_RESERVE_MUTATION = gql`
  mutation CreateReserve($input: CreateReserveInput!, $files: [Upload!]) {
    createReserve(input: $input, files: $files) {
      id
      airport {
        id
        name
        city
        code
      }
      arrival
      departure
      mealPlan {
        included
        breakfast
        lunch
        dinner
      }
      senderId
      createdAt
      updatedAt
      status
      airline {
        name
        images
      }
    }
  }
`;

export const GET_RESERVE_REQUESTS = gql`
  query Query($pagination: PaginationInput) {
    reserves(pagination: $pagination) {
      totalCount
      totalPages
      reserves {
        id
        hotel {
          hotel {
            id
          }
          capacity
        }
        airport {
          id
          name
          city
          code
        }
        arrival
        departure
        mealPlan {
          included
          breakfast
          lunch
          dinner
        }
        senderId
        createdAt
        updatedAt
        status
        airline {
          name
          images
        }
        reserveNumber
        passengerCount
        files
        chat {
          unreadMessagesCount
          hotelId
          airlineId
        }
      }
    }
  }
`;

export const GET_PASSENGER_REQUESTS = gql`
  query PassengerRequests($take: Int, $skip: Int, $filter: PassengerRequestFilterInput) {
    passengerRequests(take: $take, skip: $skip, filter: $filter) {
      id
      createdAt
      flightNumber
      airline {
        name
        images
      }
      airport {
        name
        code
      }
      statusTimes {
        acceptedAt
        inProgressAt
        finishedAt
        cancelledAt
      }
      status
      waterService {
        status
        plan {
          enabled
          peopleCount
          plannedAt
        }
        times {
          acceptedAt
          inProgressAt
          finishedAt
          cancelledAt
        }
        people {
          fullName
        }
      }
      mealService {
        status
        plan {
          enabled
          peopleCount
          plannedAt
        }
      }
      livingService {
        status
        plan {
          enabled
          peopleCount
          plannedAt
        }
        withTransfer
      }
    }
  }
`;

export const REQUEST_RESERVE_CREATED_SUBSCRIPTION = gql`
  subscription ReserveCreated {
    reserveCreated {
      id
      createdAt
      updatedAt
      airport {
        id
        name
        city
        code
      }
      airline {
        id
        name
        images
      }
      senderId
      arrival
      departure
      mealPlan {
        included
        breakfast
        lunch
        dinner
      }
      status
      reserveNumber
      passengerCount
    }
  }
`;

export const REQUEST_RESERVE_UPDATED_SUBSCRIPTION = gql`
  subscription ReserveUpdated {
    reserveUpdated {
      id
      chat {
        unreadMessagesCount
      }
    }
  }
`;
export const REQUEST_RESERVE_UPDATED_SUBSCRIPTION1 = gql`
  subscription ReserveUpdated {
    reserveUpdated {
      id
      createdAt
      updatedAt
      airport {
        id
        name
        city
        code
      }
      airline {
        id
        name
        images
      }
      senderId
      arrival
      departure
      mealPlan {
        included
        breakfast
        lunch
        dinner
      }
      status
      reserveNumber
      passengerCount
    }
  }
`;

export const GET_RESERVE_REQUEST = gql`
  query Reserve($reserveId: ID!) {
    reserve(id: $reserveId) {
      id
      airport {
        id
        name
        city
        code
      }
      arrival
      departure
      hotelChess {
        id
      }
      mealPlan {
        included
        breakfast
        lunch
        dinner
      }
      senderId
      createdAt
      updatedAt
      status
      airline {
        id
        name
        images
      }
      reserveNumber
      passengerCount
      files
      passengerList
      chat {
        unreadMessagesCount
        hotelId
        airlineId
      }
    }
  }
`;

export const GET_PASSENGER_REQUEST = gql`
  query PassengerRequest($passengerRequestId: ID!) {
    passengerRequest(id: $passengerRequestId) {
      id
      flightNumber
      flightDate
      createdBy {
        id
        name
      }
      airline {
        id
        name
        images
      }
      livingService {
        plan {
          enabled
          peopleCount
          plannedAt
        }
        withTransfer
        status
        times {
          acceptedAt
          inProgressAt
          finishedAt
          cancelledAt
        }
        hotels {
          hotelId
          name
          peopleCount
          address
          link
        }
        drivers {
          fullName
          phone
          peopleCount
          pickupAt
          link
        }
      }
      mealService {
        plan {
          enabled
          peopleCount
          plannedAt
        }
        status
        times {
          acceptedAt
          inProgressAt
          finishedAt
          cancelledAt
        }
        people {
          fullName
          issuedAt
          phone
          seat
        }
      }
      plannedPassengersCount
      routeFrom
      routeTo
      status
      statusTimes {
        acceptedAt
        inProgressAt
        finishedAt
        cancelledAt
      }
      updatedAt
      waterService {
        plan {
          enabled
          peopleCount
          plannedAt
        }
        status
        times {
          acceptedAt
          inProgressAt
          finishedAt
          cancelledAt
        }
        people {
          fullName
          issuedAt
          phone
          seat
        }
      }
    }
  }
`;

export const CREATE_RESERVE_REPORT = gql`
  mutation GenerateReserveReport($reserveId: ID!, $format: ReportFormat!) {
    generateReservePassengerFile(reserveId: $reserveId, format: $format) {
      url
    }
  }
`;

export const ADD_HOTEL_TO_RESERVE = gql`
  mutation AddHotelToReserve($reservationId: ID!, $hotelId: ID!, $capacity: Int!) {
    addHotelToReserve(reservationId: $reservationId, hotelId: $hotelId, capacity: $capacity) {
      id
    }
  }
`;

export const GET_RESERVE_REQUEST_HOTELS = gql`
  query ReservationHotels($reservationHotelsId: ID!) {
    reservationHotels(id: $reservationHotelsId) {
      id
      hotel {
        id
        name
        information {
          city
        }
      }
      hotelChess {
        status
        passenger {
          id
          name
        }
        client {
          id
          name
        }
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
      }
      passengers {
        id
        name
        number
        gender
      }
      capacity
      reserve {
        id
        arrival
        departure
        airline {
          name
          images
        }
        hotelChess {
          status
          passenger {
            id
            name
          }
          client {
            id
            name
          }
        room {
          id
          name
          category
          places
          active
          reserve
          description
          descriptionSecond
          images
        }
        }
      }
    }
  }
`;

export const GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION = gql`
  subscription ReserveHotel {
    reserveHotel {
      id
      hotel {
        id
        name
        information {
          city
        }
      }
      passengers {
        id
        name
        number
        gender
      }
      capacity
      reserve {
        id
      }
    }
  }
`;

export const GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS = gql`
  subscription ReservePersons {
    reservePersons {
      reserveHotel {
        id
        passengers {
          id
          name
          number
          gender
        }
      }
      passengers {
        id
        name
        number
        gender
      }
    }
  }
`;
export const GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT = gql`
  subscription ReservePersons {
    reservePersons {
      reserveHotel {
        id
        passengers {
          id
          name
          number
          gender
        }
      }
    }
  }
`;

export const ADD_PERSON_TO_HOTEL = gql`
  mutation AssignPersonToHotel($input: assignPersonInput!) {
    assignPersonToHotel(input: $input) {
      id
    }
  }
`;

export const ADD_PASSENGER_TO_HOTEL = gql`
  mutation Mutation($reservationId: ID!, $input: PassengerInput!, $hotelId: ID!) {
    addPassengerToReserve(reservationId: $reservationId, input: $input, hotelId: $hotelId) {
      id
    }
  }
`;

export const DELETE_PERSON_FROM_HOTEL = gql`
  mutation Mutation($reserveHotelId: ID!, $airlinePersonalId: ID!) {
    dissociatePersonFromHotel(reserveHotelId: $reserveHotelId, airlinePersonalId: $airlinePersonalId) {
      id
    }
  }
`;

export const DELETE_PASSENGER_FROM_HOTEL = gql`
  mutation DeletePassengerFromReserve($deletePassengerFromReserveId: ID!) {
    deletePassengerFromReserve(id: $deletePassengerFromReserveId) {
      id
    }
  }
`;

export const UPDATE_RESERVE = gql`
  mutation Mutation($updateReserveId: ID!, $input: UpdateReserveInput!, $files: [Upload!]) {
    updateReserve(id: $updateReserveId, input: $input, files: $files) {
      id
    }
  }
`;

// Запросы к заявкам на резерв

// ----------------------------------------------------------------

// Запросы в гостиницу

export const CREATE_HOTEL = gql`
  mutation Mutation($input: CreateHotelInput!, $images: [Upload!]) {
    createHotel(input: $input, images: $images) {
      id
      images
      name
      information {
        address
        city
      }
      stars
      usStars
      airportDistance
    }
  }
`;

export const GET_HOTELS = gql`
  query Hotels($pagination: HotelPaginationInput) {
    hotels(pagination: $pagination) {
      totalCount
      totalPages
      hotels {
        id
        name
        capacity
        information {
          city
          address
        }
        quote
        provision
        images
        stars
        usStars
        airportDistance    
      }
    }
  }
`;

export const GET_HOTELS_SUBSCRIPTION = gql`
  subscription Subscription {
    hotelCreated {
      id
      name
      information {
        city
        address
      }
      quote
      provision
      images
      stars
      airportDistance
    }
  }
`;

export const GET_HOTELS_UPDATE_SUBSCRIPTION = gql`
  subscription Subscription {
    hotelUpdated {
      id
      name
      information {
        city
        address
      }
      quote
      provision
      images
      stars
      airportDistance
      roomKind {
        id
        name
      }
    }
  }
`;

export const GET_HOTEL = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      id
      name
      nameFull
      access
      show
      discount
      meal
      capacity
      type
      stars
      usStars
      airport {
        id
        name
        code
      }
      airportDistance
      information {
        country
        city
        address
        index
        email
        number
        inn
        ogrn
        rs
        bank
        bik
        link
        description
      }
      images
      gallery
      roomKind {
        id
        name
        category
        price
        description
        images
        roomsCount
        square
        priceForAirline
        priceForAirReq
      }
      rooms {
        id
        type
        name
        beds
        category
        active
        places
        reserve
        description
        images
        priceForAirline
      }
      breakfast {
        start
        end
      }
      lunch {
        start
        end
      }
      dinner {
        start
        end
      }
      additionalServices {
        id
        name
        price
        priceForAirline
      }
    }
  }
`;

export const GET_HOTEL_MIN = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      id
      name
      access
      capacity
      type
      airport {
        id
        name
        code
      }
      information {
        city
      }
      breakfast {
        start
        end
      }
      lunch {
        start
        end
      }
      dinner {
        start
        end
      }
    }
  }
`;

export const GET_HOTEL_CITY = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      information {
        city
      }
    }
  }
`;

// export const GET_HOTEL_TARIFS = gql`
//   query Hotel($hotelId: ID!) {
//     hotel(id: $hotelId) {
//       prices {
//         priceOneCategory
//         priceTwoCategory
//         priceThreeCategory
//         priceFourCategory
//         priceFiveCategory
//         priceSixCategory
//         priceSevenCategory
//         priceEightCategory
//       }
//     }
//   }
// `;

export const GET_HOTEL_TARIFS = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      meal
      roomKind {
        id
        name
        description
        category
        price
        priceForAirline
        priceForAirReq
        square
        images
      }
      additionalServices {
        id
        name
        price
        priceForAirline
      }
    }
  }
`;

export const GET_HOTEL_MEAL_PRICE = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      mealPrice {
        breakfast
        lunch
        dinner
      }
      mealPriceForAir {
        breakfast
        lunch
        dinner
      }
    }
  }
`;

export const GET_HOTEL_ROOMS = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      type
      rooms {
        id
        roomKind {
          id
          name
        }
        name
        type
        price
        category
        beds
        places
        active
        reserve
        description
        images
        descriptionSecond
      }
    }
  }
`;

export const GET_HOTEL_NAME = gql`
  query Hotel($hotelId: ID!) {
    hotel(id: $hotelId) {
      name
      type
    }
  }
`;

export const UPDATE_HOTEL = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!, $images: [Upload!], $roomImages: [Upload!], $gallery: [Upload!]) {
    updateHotel(id: $updateHotelId, input: $input, images: $images, roomImages: $roomImages, gallery: $gallery) {
      rooms {
        id
        name
        category
        beds
        places
        reserve
        active
        description
        images
      }
      airport {
        id
        name
        code
      }
      breakfast {
        start
        end
      }
      lunch {
        start
        end
      }
      dinner {
        start
        end
      }
      images
      gallery
    }
  }
`;

export const REORDER_ROOM_KIND_IMAGES = gql`
  mutation ReorderRoomKindImages(
    $reorderRoomKindImagesId: ID!
    $imagesArray: [String!]
    $imagesToDeleteArray: [String!]
  ) {
    reorderRoomKindImages(
      id: $reorderRoomKindImagesId
      imagesArray: $imagesArray
      imagesToDeleteArray: $imagesToDeleteArray
    ) {
      images
    }
  }
`;


export const REORDER_GALLERY = gql`
  mutation ReorderHotelGalleryImages(
    $reorderHotelGalleryImagesId: ID!
    $imagesToDeleteArray: [String!]
    $imagesArray: [String!]
  ) {
    reorderHotelGalleryImages(
      id: $reorderHotelGalleryImagesId
      imagesToDeleteArray: $imagesToDeleteArray
      imagesArray: $imagesArray
    ) {
      id
    }
  }
`;

export const CREATE_MANY_ROOMS = gql`
mutation CreateManyRooms($input: ManyRoomsInput) {
  createManyRooms(input: $input) {
    id
    name
  }
}
`;

// export const UPDATE_HOTEL_TARIF = gql`
//   mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!) {
//     updateHotel(id: $updateHotelId, input: $input) {
//       prices {
//         priceOneCategory
//         priceTwoCategory
//         priceThreeCategory
//         priceFourCategory
//         priceFiveCategory
//         priceSixCategory
//         priceSevenCategory
//         priceEightCategory
//       }
//     }
//   }
// `;
export const UPDATE_HOTEL_TARIF = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!, $roomKindImages: [Upload!]) {
    updateHotel(id: $updateHotelId, input: $input, roomKindImages: $roomKindImages) {
      id
      roomKind {
        id
        name
        description
        category
        square
        price
        images
      }
    }
  }
`;

export const UPDATE_HOTEL_MEAL_TARIF = gql`
  mutation UpdateHotel($updateHotelId: ID!, $input: UpdateHotelInput!) {
    updateHotel(id: $updateHotelId, input: $input) {
      mealPrice {
        breakfast
        lunch
        dinner
      }
    }
  }
`;

export const DELETE_HOTEL_CATEGORY = gql`
  mutation DeleteCategory($deleteCategoryId: ID!) {
    deleteCategory(id: $deleteCategoryId) {
      name
    }
  }
`;

// export const DELETE_HOTEL_TARIFF = gql`
//   mutation Mutation($deleteTariffId: ID!) {
//     deleteTariff(id: $deleteTariffId) {
//       name
//     }
//   }
// `;

export const DELETE_HOTEL_TARIFF = gql`
  mutation DeleteRoomKind($deleteRoomKindId: ID!) {
    deleteRoomKind(id: $deleteRoomKindId) {
      id
    }
  }
`;

export const DELETE_HOTEL_ROOM = gql`
  mutation Mutation($deleteRoomId: ID!) {
    deleteRoom(id: $deleteRoomId) {
      name
    }
  }
`;

export const DELETE_HOTEL = gql`
  mutation DeleteHotel($deleteHotelId: ID!) {
    deleteHotel(id: $deleteHotelId) {
      id
      name
    }
  }
`;

export const GET_HOTEL_USERS = gql`
  query HotelUsers($hotelId: ID!) {
    hotelUsers(hotelId: $hotelId, pagination: {all: true}) {
    users {
      id
      name
      email
      role
      position {
        id
        name
      }
      login
      images
    }
    }
  }
`;

export const CREATE_HOTEL_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!, $images: [Upload!]) {
    registerUser(input: $input, images: $images) {
      id
      name
      email
      role
      position {
        id
        name
      }
      login
      images
    }
  }
`;

export const UPDATE_HOTEL_USER = gql`
  mutation Mutation($input: UpdateUserInput!, $images: [Upload!]) {
    updateUser(input: $input, images: $images) {
      id
      name
      email
      role
      position {
        id
        name
      }
      login
      images
    }
  }
`;

export const DELETE_HOTEL_USER = gql`
  mutation Mutation($deleteUserId: ID!) {
    deleteUser(id: $deleteUserId) {
      id
      name
      email
      role
      login
      images
    }
  }
`;

// Запросы в гостиницу

// ----------------------------------------------------------------

// Запросы в авиакомпанию

export const GET_AIRLINES = gql`
  query Airlines($pagination: AirlinePaginationInput) {
    airlines(pagination: $pagination) {
      totalCount
      totalPages
      airlines {
        id
        images
        name
        nameFull
      }
    }
  }
`;

export const GET_AIRLINES_SUBSCRIPTION = gql`
  subscription Subscription {
    airlineCreated {
      id
      images
      name
    }
  }
`;

export const GET_AIRLINES_UPDATE_SUBSCRIPTION = gql`
  subscription Subscription {
    airlineUpdated {
      id
      images
      name
      prices {
        id
        airports {
          id
          airport {
            id
            name
            city
            code
          }
        }
        mealPrice {
          breakfast
          lunch
          dinner
        }
        prices {
          priceApartment
          priceStudio
          priceLuxe
          priceOneCategory
          priceTwoCategory
          priceThreeCategory
          priceFourCategory
          priceFiveCategory
          priceSixCategory
          priceSevenCategory
          priceEightCategory
          priceNineCategory
          priceTenCategory
        }
        name
      }
    }
  }
`;

export const CREATE_AIRLINE = gql`
  mutation Mutation($input: CreateAirlineInput!, $images: [Upload!]) {
    createAirline(input: $input, images: $images) {
      id
      images
      name
    }
  }
`;

export const GET_AIRLINE = gql`
  query Airline($airlineId: ID!) {
    airline(id: $airlineId) {
      id
      name
      nameFull
      images
      information {
        country
        city
        address
        index
        email
        number
        inn
        ogrn
        rs
        bank
        bik
        description
        link
      }
      staff {
        id
        name
        gender
        position {
          id
          name
        }
      }
    }
  }
`;

// export const GET_AIRLINE_TARIFS = gql`
//   query Airline($airlineId: ID!) {
//     airline(id: $airlineId) {
//       prices {
//         priceOneCategory
//         priceTwoCategory
//         priceThreeCategory
//         priceFourCategory
//         priceFiveCategory
//         priceSixCategory
//         priceSevenCategory
//         priceEightCategory
//         priceApartment
//         priceStudio
//       }
//     }
//   }
// `;

export const GET_AIRLINE_TARIFS = gql`
  query Airline($airlineId: ID!) {
    airline(id: $airlineId) {
      prices {
        airports {
          id
          airport {
            id
            name
            code
            city
          }
        }
        id
        name
        prices {
          priceApartment
          priceStudio
          priceLuxe
          priceOneCategory
          priceTwoCategory
          priceThreeCategory
          priceFourCategory
          priceFiveCategory
          priceSixCategory
          priceSevenCategory
          priceEightCategory
        }
        mealPrice {
          breakfast
          dinner
          lunch
        }
      }
    }
  }
`;

export const GET_AIRLINE_MEAL_PRICE = gql`
  query Airline($airlineId: ID!) {
    airline(id: $airlineId) {
      mealPrice {
        breakfast
        dinner
        lunch
      }
    }
  }
`;

export const UPDATE_AIRLINE = gql`
  mutation Mutation($updateAirlineId: ID!, $input: UpdateAirlineInput!, $images: [Upload!]) {
    updateAirline(id: $updateAirlineId, input: $input, images: $images) {
      name
      id
      images
      information {
        country
        city
        address
        index
        email
        number
        inn
        ogrn
        rs
        bank
        bik
        link
        description
      }
    }
  }
`;

export const UPDATE_AIRLINE_TARIF = gql`
  mutation UpdateAirline($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      id
      prices {
        id
      }
    }
  }
`;

export const UPDATE_AIRLINE_MEAL_TARIF = gql`
  mutation UpdateAirline($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      mealPrice {
        breakfast
        lunch
        dinner
      }
    }
  }
`;

export const DELETE_AIRLINE_CATEGORY = gql`
  mutation DeleteCategory($deleteCategoryId: ID!) {
    deleteCategory(id: $deleteCategoryId) {
      name
    }
  }
`;

export const DELETE_AIRLINE_TARIFF = gql`
  mutation Mutation($deleteTariffId: ID!) {
    deleteTariff(id: $deleteTariffId) {
      name
    }
  }
`;

export const GET_AIRLINE_COMPANY = gql`
  query Query($airlineId: ID!) {
    airline(id: $airlineId) {
      id
      name
      department {
        id
        name
        users {
          id
          name
          role
          position {
            id
            name
          }
          images
          email
          login
        }
        position {
          id
          name
        }
        accessMenu {
          requestMenu
          requestCreate
          requestUpdate
          requestChat
          personalMenu
          personalCreate
          personalUpdate
          reserveMenu
          reserveCreate
          reserveUpdate
          analyticsMenu
          analyticsUpload
          reportMenu
          reportCreate
          userMenu
          userCreate
          userUpdate
          airlineMenu
          airlineUpdate
          contracts
        }
      }
    }
  }
`;

export const CREATE_AIRLINE_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!, $images: [Upload!]) {
    registerUser(input: $input, images: $images) {
      id
      images
      name
      role
      position {
        id
        name
      }
      login
      password
      email
    }
  }
`;

export const CREATE_AIRLINE_DEPARTMERT = gql`
  mutation UpdateAirline($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      id
      name
      department {
        id
        name
        users {
          id
          name
          role
          images
          email
          login
          password
        }
      }
    }
  }
`;

export const CREATE_AIRLINE_STAFF = gql`
  mutation Mutation($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      staff {
        id
        name
        number
        position {
          id 
          name
        }
        gender
      }
    }
  }
`;

export const UPDATE_AIRLINE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!, $images: [Upload!]) {
    updateUser(input: $input, images: $images) {
        id
        name
        email
        role
        position {
          id
          name
        }
        login
        images
    }
  }
`;

export const DELETE_AIRLINE_DEPARTMENT = gql`
  mutation Mutation($deleteAirlineDepartmentId: ID!) {
    deleteAirlineDepartment(id: $deleteAirlineDepartmentId) {
      id
    }
  }
`;

export const DELETE_AIRLINE_MANAGER = gql`
  mutation Mutation($deleteUserId: ID!) {
    deleteUser(id: $deleteUserId) {
      id
    }
  }
`;

export const GET_AIRLINE_USERS = gql`
  query AirlineUsers($airlineId: ID!, $hcPagination: HotelChessPaginationInput) {
    airline(id: $airlineId) {
      staff {
        id
        name
        gender
        number
        hotelChess(hcPagination: $hcPagination) {
          request {
            requestNumber
            status
          }
          start
          end
          clientId
          requestId
          reserveId
          hotel {
            name
          }
        }
        position {
          id
          name
        }
      }
    }
  }
`;

export const GET_AIRLINE_DEPARTMENT = gql`
  query AirlineDepartment($airlineDepartmentId: ID!) {
    airlineDepartment(id: $airlineDepartmentId) {
      id
      name
      accessMenu {
        requestMenu
        requestCreate
        requestUpdate
        requestChat
        personalMenu
        personalCreate
        personalUpdate
        reserveMenu
        reserveCreate
        reserveUpdate
        analyticsMenu
        analyticsUpload
        reportMenu
        reportCreate
        userMenu
        userCreate
        userUpdate
        airlineMenu
        airlineUpdate
        contracts
      }
    }
  }
`;

export const UPDATE_AIRLINE_STAFF = gql`
  mutation Mutation($updateAirlineId: ID!, $input: UpdateAirlineInput!) {
    updateAirline(id: $updateAirlineId, input: $input) {
      staff {
        id
        name
        number
        position {
          id
          name
        }
        gender
      }
    }
  }
`;

export const DELETE_AIRLINE_STAFF = gql`
  mutation DeleteAirlineStaff($deleteAirlineStaffId: ID!) {
    deleteAirlineStaff(id: $deleteAirlineStaffId) {
      id
      name
    }
  }
`;

export const GET_STAFF_HOTELS = gql`
  query AirlineStaffs($airlineStaffsId: ID!) {
    airlineStaffs(id: $airlineStaffsId) {
      name
      number
      position {
        id
        name
      }
      gender
      hotelChess {
        request {
          requestNumber
        }
        start
        end
        clientId
        requestId
        reserveId
        hotel {
          name
        }
      }
    }
  }
`;

// Запросы в авиакомпанию

// Запросы в компанию

export const GET_DISPATCHERS = gql`
  query Query($pagination: UserPaginationInput) {
    dispatcherUsers(pagination: $pagination) {
      totalCount
      totalPages
      users {
        id
        dispatcherDepartmentId
        name
        images
        role
        position {
          id
          name
        }
        email
        login
      }
    }
  }
`;

export const GET_ALL_DISPATCHERS = gql`
  query Query {
    dispatcherUsers(pagination: {all:true}) {
      totalCount
      totalPages
      users {
        id
        dispatcherDepartmentId
        name
        images
        role
        position {
          id
          name
        }
        email
        login
      }
    }
  }
`;

export const GET_DISPATCHER_DEPARTMENTS = gql`
  query DispatcherDepartments($pagination: DispatcherDepartmentPaginationInput) {
    dispatcherDepartments(pagination: $pagination) {
      totalCount
      totalPages
      departments {
        id
        name
        active
        email
        accessMenu {
          requestMenu
          requestCreate
          requestUpdate
          requestChat
          transferMenu
          transferCreate
          transferUpdate
          transferChat
          personalMenu
          personalCreate
          personalUpdate
          reserveMenu
          reserveCreate
          reserveUpdate
          analyticsMenu
          analyticsUpload
          reportMenu
          reportCreate
          userMenu
          userCreate
          userUpdate
          airlineMenu
          airlineUpdate
          contracts
        }
        dispatchers {
          id
          dispatcherDepartmentId
          name
          images
          role
          position {
            id
            name
          }
          email
          login
        }
      }
    }
  }
`;

export const CREATE_DISPATCHER_DEPARTMENT = gql`
  mutation CreateDispatcherDepartment($input: DispatcherDepartmentInput!) {
    createDispatcherDepartment(input: $input) {
      id
      name
      email
    }
  }
`;

export const UPDATE_DISPATCHER_DEPARTMENT = gql`
  mutation UpdateDispatcherDepartment($updateDispatcherDepartmentId: ID!, $input: DispatcherDepartmentInput!) {
    updateDispatcherDepartment(id: $updateDispatcherDepartmentId, input: $input) {
      id
    }
  }
`;

export const DELETE_DISPATCHER_DEPARTMENT = gql`
  mutation DeleteDispatcherDepartment($deleteDispatcherDepartmentId: ID!) {
    deleteDispatcherDepartment(id: $deleteDispatcherDepartmentId) {
      id
    }
  }
`;

export const GET_DISPATCHERS_SUBSCRIPTION = gql`
  subscription Subscription {
    userCreated {
      id
      name
      images
      role
      position {
        id
        name
      }
      email
      login
      airlineDepartmentId
      hotelId
      dispatcher
      airlineId
      support
    }
  }
`;

export const GET_DISPATCHER = gql`
  query Query($userId: ID!) {
    user(userId: $userId) {
      id
      name
      role
      support
      position {
        id
        name
      }
      images
      login
      email
      hotelId
      airlineId
      dispatcher
      airlineDepartmentId
    }
  }
`;

export const CREATE_DISPATCHER_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!, $images: [Upload!]) {
    registerUser(input: $input, images: $images) {
      id
      dispatcherDepartmentId
      name
      email
      role
      position {
        id
        name
      }
      login
      images
    }
  }
`;

export const UPDATE_DISPATCHER_USER = gql`
  mutation Mutation($input: UpdateUserInput!, $images: [Upload!]) {
    updateUser(input: $input, images: $images) {
      id
      dispatcherDepartmentId
      name
      email
      role
      position {
        id
        name
      }
      login
      images
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!, $images: [Upload!]) {
    updateUser(input: $input, images: $images) {
      id
      name
      email
      login
      images
    }
  }
`;




export const DELETE_DISPATCHER_USER = gql`
  mutation Mutation($deleteUserId: ID!) {
    deleteUser(id: $deleteUserId) {
      id
      name
      email
      role
      login
      images
    }
  }
`;

// Запросы в компанию

// Отчеты

export const CREATE_REPORT = gql`
  mutation CreateAirlineReport($input: CreateReportInput!, $createFilterInput: createFilterInput) {
    createAirlineReport(input: $input, createFilterInput: $createFilterInput) {
      id
      url
    }
  }
`;

export const CREATE_HOTEL_REPORT = gql`
  mutation CreateHotelReport($input: CreateReportInput!, $createFilterInput: createFilterInput) {
    createHotelReport(input: $input, createFilterInput: $createFilterInput) {
      url
    }
  }
`;

export const GET_AIRLINE_REPORT = gql`
  query GetAirlineReport($filter: ReportFilterInput) {
    getAirlineReport(filter: $filter) {
      airlineId
      reports {
        id
        name
        url
        createdAt
        airlineId
        airline {
          id
          name
          images
        }
        startDate
        endDate
      }
    }
  }
`;

export const GET_REPORTS_SUBSCRIPTION = gql`
  subscription Subscription {
    reportCreated {
      id
      name
    }
  }
`;

export const GET_HOTEL_REPORT = gql`
  query GetHotelReport($filter: ReportFilterInput) {
    getHotelReport(filter: $filter) {
      hotelId
      reports {
        id
        name
        url
        createdAt
        hotelId
        hotel {
          id
          name
          images
        }
        startDate
        endDate
      }
    }
  }
`;


export const DELETE_REPORT = gql`
  mutation DeleteReport($deleteReportId: ID!) {
    deleteReport(id: $deleteReportId) {
      id
    }
  }
`;


// Отчеты



// Поддержка

export const GET_USER_SUPPORT_CHATS = gql`
  query SupportChats {
    supportChats {
      id
      createdAt
      participants {
        id
        name
        images
      }
      messages {
        id
        sender {
          id
          name
          role
        }
        text
        isRead
      }
      unreadMessagesCount
    }
  }
`;

export const UNREAD_MESSAGES_COUNT = gql`
  query Query($chatId: ID!, $userId: ID!) {
    unreadMessagesCount(chatId: $chatId, userId: $userId)
  }
`;

export const GET_USER_SUPPORT_CHAT = gql`
  query UserSupportChat($userId: ID!) {
    userSupportChat(userId: $userId) {
      id
      participants {
        id
        name
      }
      createdAt
      messages {
        id
        createdAt
        text
        sender {
          id
          name
          role
        }
        isRead
        readBy {
          user {
            id
            name
          }
        }
      }
      unreadMessagesCount
    }
  }
`;

// Поддержка



// Patch Notes

export const CREATE_PATCH_NOTE = gql`
  mutation CreatePatchNote($data: PatchNoteInput!) {
    createPatchNote(data: $data) {
      id
      date
      name
      description
      files
    }
  }
`;

export const GET_ALL_PATCH_NOTES = gql`
  query GetAllPatchNotes {
    getAllPatchNotes {
      date
      description
      files
      id
      name
    }
  }
`;

export const GET_PATCH_NOTE = gql`
  query GetPatchNote($getPatchNoteId: ID!) {
    getPatchNote(id: $getPatchNoteId) {
      id
      date
      name
      description
      files
    }
  }
`;

export const UPDATE_PATCH_NOTE = gql`
  mutation UpdatePatchNote($updatePatchNoteId: ID!, $data: PatchNoteUpdateInput!) {
    updatePatchNote(id: $updatePatchNoteId, data: $data) {
      id
    }
  }
`;

// Patch Notes


// Документация

export const CREATE_DOCUMENTATION = gql`
  mutation CreateDocumentation($data: DocumentationInput!, $imageGroupsByKey: [DocUploadByKeyInput!]) {
    createDocumentation(data: $data, imageGroupsByKey: $imageGroupsByKey) {
      id
      name
      type
    }
  }
`;

export const GET_ALL_DOCUMENTATION = gql`
  query GetAllDocumentations($type: DocumentationType, $filter: DocumentationFilter) {
    getAllDocumentations(type: $type, filter: $filter) {
      id
      name
      parentId
    }
  }
`;

export const GET_DOCUMENTATION = gql`
  query GetDocumentation($getDocumentationId: ID!) {
    getDocumentation(id: $getDocumentationId) {
      id
      name
      description
      files
    }
  }
`;

export const GET_DOCUMENTATION_TREE = gql`
  query DocumentationTree($documentationTreeId: ID!) {
    documentationTree(id: $documentationTreeId)
  }
`;

export const UPDATE_DOCUMENTATION = gql`
  mutation UpdateDocumentation($updateDocumentationId: ID!, $data: DocumentationUpdateInput!, $imageGroupsByKey: [DocUploadByKeyInput!], $pruneMissingChildren: Boolean) {
    updateDocumentation(id: $updateDocumentationId, data: $data, imageGroupsByKey: $imageGroupsByKey, pruneMissingChildren: $pruneMissingChildren) {
      id
    }
  }
`;

// Документация


// Компания и договоры

export const GET_ALL_COMPANIES = gql`
  query GetAllCompany {
    getAllCompany {
      id
      name
      information {
        inn
        ogrn
      }
    }
  }
`;

export const GET_COMPANY = gql`
  query GetCompany($getCompanyId: ID) {
    getCompany(id: $getCompanyId) {
      id
      name
      information {
        country
        city
        address
        index
        email
        number
        inn
        ogrn
        rs
        bank
        bik
        link
        description
      }
    }
  }  
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CompanyInput) {
    createCompany(input: $input) {
      id
      name
      information {
        inn
        ogrn
      }
    }
  }
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($input: CompanyInput) {
    updateCompany(input: $input) {
      id
    }
  }
`;

export const CREATE_AIRLINE_CONTRACT = gql`
  mutation CreateAirlineContract($input: AirlineContractCreateInput!, $files: [Upload!]) {
    createAirlineContract(input: $input, files: $files) {
      id
    }
  }
`;

export const CREATE_AIRLINE_AA = gql`
  mutation CreateAdditionalAgreement($input: AdditionalAgreementInput!, $files: [Upload!]) {
    createAdditionalAgreement(input: $input, files: $files) {
      id
    }
  }
`;

export const GET_AIRLINE_CONTRACTS = gql`
  query AirlineContracts($orderBy: AirlineContractOrderByInput, $filter: AirlineContractFilter, $pagination: ContractPaginationInput) {
    airlineContracts(orderBy: $orderBy, filter: $filter, pagination: $pagination) {
      totalPages  
      totalCount
      items {
        id
        companyId
        company {
          name
        }
        airlineId
        airline {
          name
          images
        }
        date
        contractNumber
        region
        applicationType
        notes
        files
        additionalAgreements {
          id
          notes
          contractNumber
        }
      }
    }
  }
`;

export const GET_AIRLINE_CONTRACT = gql`
  query AirlineContract($airlineContractId: ID!) {
    airlineContract(id: $airlineContractId) {
      id
      companyId
      company {
        name
      }
      airlineId
      airline {
        name
      }
      date
      contractNumber
      region
      applicationType
      notes
      files
      additionalAgreements {
        id
        contractNumber
        date
        itemAgreement
        notes
        files
      }
    }
  }
`;

export const GET_AIRLINE_CONTRACT_AA = gql`
  query AdditionalAgreements($airlineContractId: ID) {
    additionalAgreements(airlineContractId: $airlineContractId) {
      id
      itemAgreement
      notes
      files
      date
      contractNumber
    }
  }
`;

export const UPDATE_AIRLINE_CONTRACT = gql`
  mutation UpdateAirlineContract($updateAirlineContractId: ID!, $input: AirlineContractUpdateInput!, $files: [Upload!]) {
    updateAirlineContract(id: $updateAirlineContractId, input: $input, files: $files) {
      id
    }
  }
`;

export const UPDATE_AIRLINE_CONTRACT_AA = gql`
  mutation UpdateAdditionalAgreement($updateAdditionalAgreementId: ID!, $input: AdditionalAgreementInput!, $files: [Upload!]) {
    updateAdditionalAgreement(id: $updateAdditionalAgreementId, input: $input, files: $files) {
      id
    }
  }
`;

export const DELETE_AIRLINE_CONTRACT_AA = gql`
  mutation DeleteAdditionalAgreement($deleteAdditionalAgreementId: ID!) {
    deleteAdditionalAgreement(id: $deleteAdditionalAgreementId)
  }
`;

export const DELETE_AIRLINE_CONTRACT = gql`
  mutation DeleteAirlineContract($deleteAirlineContractId: ID!) {
    deleteAirlineContract(id: $deleteAirlineContractId)
  }
`;

export const DELETE_HOTEL_CONTRACT = gql`
  mutation DeleteHotelContract($deleteHotelContractId: ID!) {
    deleteHotelContract(id: $deleteHotelContractId)
  }
`;

export const CREATE_HOTEL_CONTRACT = gql`
  mutation CreateHotelContract($input: HotelContractCreateInput!, $files: [Upload!]) {
    createHotelContract(input: $input, files: $files) {
      id
    }
  }
`;


export const GET_HOTEL_CONTRACTS = gql`
  query HotelContracts( $filter: HotelContractFilter, $orderBy: HotelContractOrderByInput, $pagination: ContractPaginationInput) {
    hotelContracts( filter: $filter, orderBy: $orderBy, pagination: $pagination) {
      totalPages  
      totalCount
      items {
        id
        companyId
        company {
          name
        }
        hotelId
        hotel {
          name
          images
        }
        cityId
        region {
          id
          region
          city
        }
        date
        contractNumber
        notes
        legalEntity
        signatureMark
        completionMark
        normativeAct
        applicationType
        executor
        files
      }
    }
  }
`;

export const GET_HOTEL_CONTRACT = gql`
  query HotelContract($hotelContractId: ID!) {
    hotelContract(id: $hotelContractId) {
      id
      companyId
      company {
        name
      }
      hotelId
      hotel {
        name
      }
      cityId
      region {
        id
        city
        region
      }
      date
      contractNumber
      notes
      legalEntity
      signatureMark
      completionMark
      normativeAct
      applicationType
      executor
      files
      additionalAgreements {
        id
        contractNumber
        date
        itemAgreement
        notes
        files
      }
    }
  }
`;

export const UPDATE_HOTEL_CONTRACT = gql`
  mutation UpdateHotelContract($updateHotelContractId: ID!, $input: HotelContractUpdateInput!, $files: [Upload!]) {
    updateHotelContract(id: $updateHotelContractId, input: $input, files: $files) {
      id
    }
  }
`;

export const SUBSCRIPTION_AIRLINE_CONTRACTS = gql`
  subscription ContractAirline {
    contractAirline {
      id
    }
  }
`;

export const SUBSCRIPTION_HOTEL_CONTRACTS = gql`
  subscription ContractHotel {
    contractHotel {
      id
    }
  }
`;

export const CREATE_PRICE_TARIFFS = gql`
  mutation CreatePriceCategory($input: PriceCategoryInput) {
    createPriceCategory(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_PRICE_TARIFFS = gql`
  mutation UpdatePriceCategory($input: PriceCategoryInput) {
    updatePriceCategory(input: $input) {
      id
    }
  }
`;

export const GET_ALL_TARIFFS = gql`
  query GetAllPriceCategory($filter: PriceCategoryFilterInput) {
    getAllPriceCategory(filter: $filter) {
      id
      name
      airlinePrices {
        id
        prices {
          priceApartment
          priceStudio
          priceLuxe
          priceOneCategory
          priceTwoCategory
          priceThreeCategory
          priceFourCategory
          priceFiveCategory
          priceSixCategory
          priceSevenCategory
          priceEightCategory
        }
        mealPrice {
          breakfast
          lunch
          dinner
        }
        name
        airports {
          id
          airport {
            id
            name
            code
            city
          }
        }
      }
      airline {
        id
        name
      }
      company {
        id
        name
      }
    }
  }
`;

export const PRICE_CATEGORY_CHANGE_SUBSCRIPTION = gql`
  subscription PriceCategoryChanged {
    priceCategoryChanged {
      id
      airlinePrices {
        id
        airports {
          id
          airport {
            id
            name
            code
            city
          }
        }
        name
        prices {
          priceApartment
          priceStudio
          priceLuxe
          priceOneCategory
          priceTwoCategory
          priceThreeCategory
          priceFourCategory
          priceFiveCategory
          priceSixCategory
          priceSevenCategory
          priceEightCategory
          priceNineCategory
          priceTenCategory
        }
        mealPrice {
          breakfast
          lunch
          dinner
        }
      }
      airline {
        name
        id
      }
      name
      company {
        name
        id
      }
    }
}
`;

export const COMPANY_CHANGE_SUBSCRIPTION = gql`
  subscription CompanyChanged {
    companyChanged {
      id
    }
  }
`;


// Компания и договоры


// Аналитика

export const GET_ANALYTICS_AIRLINE_REQUESTS = gql`
  query AnaliticsAirlineRequests($input: AnalyticsInput) {
    analyticsEntityRequests(input: $input) {
      createdByPeriod {
        date
        count_created
        count_canceled
      }
      totalCreatedRequests
      totalCancelledRequests
      statusCounts
    }
  }
`;


export const GET_ANALYTICS_USERS = gql`
  query AnalyticsEntityUsers($input: AnalyticsUserInput) {
    analyticsEntityUsers(input: $input) {
      createdRequests
      processedRequests
      cancelledRequests
    }
  }
`;

// Аналитика