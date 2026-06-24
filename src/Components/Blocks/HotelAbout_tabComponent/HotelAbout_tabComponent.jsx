import { useEffect, useMemo, useState } from "react";
import classes from "./HotelAbout_tabComponent.module.css";
import { useQuery, useSubscription } from "@apollo/client";
import HotelAboutRoomBlock from "../HotelAboutRoomBlock/HotelAboutRoomBlock.jsx";
import {
  getMediaUrl,
  getCookie,
  GET_HOTEL,
  GET_HOTEL_PREVIEW,
  decodeJWT,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  GET_HOTEL_MEAL_PRICE,
  GET_HOTEL_TRANSFER_PRICE,
} from "../../../../graphQL_requests.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import TextEditorOutput from "../TextEditorOutput/TextEditorOutput.jsx";
import HotelAboutTariffs from "../HotelAboutTariffs/HotelAboutTariffs.jsx";
import HotelAboutGallery from "./HotelAboutGallery.jsx";

const TABS = [
  { key: "about", label: "Общая информация", icon: DocIcon },
  { key: "rooms", label: "Номера", icon: BedIcon },
  { key: "tariffs", label: "Тарифы", icon: TagIcon },
];

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20v-9a2 2 0 0 1 2-2h6v6" />
      <path d="M11 15h10v5" />
      <path d="M3 17h18" />
      <rect x="5" y="11" width="5" height="3" rx="1" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h6.9a2 2 0 0 1 1.4.6l7.5 7.5a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function StarRow({ value = 0, size = 16 }) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className={classes.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < filled ? "#F5A623" : "none"}>
          <path
            d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.77l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93L12 2.6z"
            stroke={i < filled ? "#F5A623" : "#C9CEDD"}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

function RailRow({ label, value, strong }) {
  return (
    <div className={classes.railRow}>
      <span className={classes.railRowLabel}>{label}</span>
      <span className={`${classes.railRowValue} ${strong ? classes.railRowStrong : ""}`}>
        {value}
      </span>
    </div>
  );
}

function HotelAbout_tabComponent({ id, isPreview = false, previewToken }) {
  const token = isPreview ? null : getCookie("token");
  const user = isPreview ? null : decodeJWT(token);
  const mediaToken = isPreview ? previewToken : undefined;

  const [tab, setTab] = useState("about");

  const { loading, error, data, refetch } = useQuery(GET_HOTEL, {
    skip: isPreview,
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { hotelId: id },
  });

  const {
    loading: previewLoading,
    error: previewError,
    data: previewData,
  } = useQuery(GET_HOTEL_PREVIEW, {
    skip: !isPreview,
    context: { headers: { Authorization: `Bearer ${previewToken}` } },
  });

  const { data: mealPriceData } = useQuery(GET_HOTEL_MEAL_PRICE, {
    skip: isPreview,
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { hotelId: id },
  });

  const { data: transferPriceData } = useQuery(GET_HOTEL_TRANSFER_PRICE, {
    skip: isPreview,
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { hotelId: id },
  });

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION,
    { skip: isPreview }
  );

  const [hotel, setHotel] = useState(null);
  const [additionalServices, setAdditionalServices] = useState([]);
  const [mealPricesAirline, setMealPricesAirline] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });
  const [mealPriceForAirReq, setMealPriceForAirReq] = useState(false);
  const [transferPricesAirline, setTransferPricesAirline] = useState({
    arrival: 0,
    departure: 0,
  });
  const [transferPriceForAirReq, setTransferPriceForAirReq] = useState(false);

  useEffect(() => {
    if (data) {
      setHotel(data.hotel);
      setAdditionalServices(data?.hotel?.additionalServices);
    }
  }, [data]);

  useEffect(() => {
    if (isPreview && previewData?.hotelPreview) {
      const preview = previewData.hotelPreview;
      setHotel(preview);
      setAdditionalServices(preview.additionalServices);
      setMealPricesAirline({
        breakfast: preview.mealPriceForAir?.breakfast,
        lunch: preview.mealPriceForAir?.lunch,
        dinner: preview.mealPriceForAir?.dinner,
      });
      setMealPriceForAirReq(Boolean(preview.mealPriceForAirReq));
      setTransferPricesAirline({
        arrival: preview.transferPriceForAir?.arrival ?? 0,
        departure: preview.transferPriceForAir?.departure ?? 0,
      });
      setTransferPriceForAirReq(Boolean(preview.transferPriceForAirReq));
    }
  }, [isPreview, previewData]);

  useEffect(() => {
    if (mealPriceData) {
      setMealPricesAirline({
        breakfast: mealPriceData.hotel?.mealPriceForAir?.breakfast,
        lunch: mealPriceData.hotel?.mealPriceForAir?.lunch,
        dinner: mealPriceData.hotel?.mealPriceForAir?.dinner,
      });
      setMealPriceForAirReq(Boolean(mealPriceData.hotel?.mealPriceForAirReq));
    }
  }, [mealPriceData]);

  useEffect(() => {
    if (transferPriceData) {
      setTransferPricesAirline({
        arrival: transferPriceData.hotel?.transferPriceForAir?.arrival ?? 0,
        departure: transferPriceData.hotel?.transferPriceForAir?.departure ?? 0,
      });
      setTransferPriceForAirReq(
        Boolean(transferPriceData.hotel?.transferPriceForAirReq)
      );
    }
  }, [transferPriceData]);

  useEffect(() => {
    if (dataSubscriptionUpd) refetch();
  }, [dataSubscriptionUpd]);

  const rooms = useMemo(
    () => (hotel?.type !== "apartment" ? hotel?.roomKind : hotel?.rooms),
    [hotel]
  );

  const isLoading = isPreview ? previewLoading : loading;
  const queryError = isPreview ? previewError : error;

  if (isLoading) return <MUILoader fullHeight={"70vh"} />;
  if (queryError) return <p>Error: {queryError.message}</p>;
  if (!hotel) return null;

  const avatar = hotel.images?.length
    ? getMediaUrl(hotel.images[0], mediaToken)
    : "/no-avatar.png";
  const city = hotel.location?.city || hotel.information?.city || "";
  const address = hotel.information?.address || hotel.location?.address || "";
  const locationLine = [city, address].filter(Boolean).join(", ");
  const roomCategoriesCount = rooms?.length || 0;
  const fmtMeal = (m) =>
    m?.start && m?.end ? `${m.start}–${m.end}` : "—";

  const cardStyle = isPreview
    ? { height: "auto" }
    : user?.hotelId || user?.airlineId
    ? { height: "calc(100vh - 130px)" }
    : undefined;
  const contentStyle = isPreview ? { overflow: "visible" } : undefined;

  return (
    <div className={classes.card} style={cardStyle}>
      <div className={classes.identity}>
        <div className={classes.avatar}>
          <img src={avatar} alt={hotel.name} />
        </div>
        <div className={classes.identityText}>
          <div className={classes.name}>{hotel.name}</div>
          <div className={classes.identityMeta}>
            <StarRow value={hotel.stars} />
            {locationLine && (
              <span className={classes.locationLine}>
                <PinIcon />
                {locationLine}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={classes.tabs}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`${classes.tab} ${tab === key ? classes.tabActive : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      <div className={classes.content} style={contentStyle}>
        {tab === "about" && (
          <div className={classes.aboutGrid}>
            <div className={classes.aboutMain}>
              <HotelAboutGallery
                images={hotel.gallery || []}
                mediaToken={mediaToken}
              />
              <div className={classes.aboutDesc}>
                <div className={classes.sectionLabel}>О гостинице</div>
                <div className={classes.descBody}>
                  <TextEditorOutput description={hotel.information?.description} />
                </div>
              </div>
            </div>

            <aside className={classes.rail}>
              <div className={classes.railCard}>
                <div className={classes.railTitle}>Информация</div>
                <div className={classes.railRows}>
                  <RailRow label="Класс" value={<StarRow value={hotel.stars} />} />
                  {!isPreview && hotel.capacity ? (
                    <RailRow label="Вместимость" value={`${hotel.capacity} мест`} strong />
                  ) : null}
                  {hotel.airportDistance ? (
                    <RailRow label="До аэропорта" value={`${hotel.airportDistance} мин`} strong />
                  ) : null}
                  {roomCategoriesCount ? (
                    <RailRow label="Категорий номеров" value={roomCategoriesCount} strong />
                  ) : null}
                </div>
              </div>

              <div className={classes.railCard}>
                <div className={classes.railTitle}>Контакты</div>
                <div className={classes.railRows}>
                  {city ? <RailRow label="Город" value={city} strong /> : null}
                  {address ? <RailRow label="Адрес" value={address} strong /> : null}
                  {hotel.information?.number ? (
                    <RailRow label="Телефон" value={hotel.information.number} strong />
                  ) : null}
                  {hotel.information?.email ? (
                    <RailRow label="E-mail" value={hotel.information.email} strong />
                  ) : null}
                  {hotel.information?.link ? (
                    <RailRow label="Сайт" value={hotel.information.link} strong />
                  ) : null}
                </div>
              </div>

              {hotel.meal && (
                <div className={classes.railCard}>
                  <div className={classes.railTitle}>Питание</div>
                  <div className={classes.railRows}>
                    <RailRow label="Завтрак" value={fmtMeal(hotel.breakfast)} strong />
                    <RailRow label="Обед" value={fmtMeal(hotel.lunch)} strong />
                    <RailRow label="Ужин" value={fmtMeal(hotel.dinner)} strong />
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {tab === "rooms" && (
          <div className={classes.roomsGrid}>
            {rooms?.length ? (
              rooms.map((room) => (
                <HotelAboutRoomBlock
                  key={room.id}
                  user={user}
                  mediaToken={mediaToken}
                  {...room}
                />
              ))
            ) : (
              <div className={classes.empty}>Нет номеров</div>
            )}
          </div>
        )}

        {tab === "tariffs" && (
          <HotelAboutTariffs
            user={user}
            tariffs={rooms || {}}
            mealPrices={hotel?.meal ? mealPricesAirline : null}
            mealPriceForAirReq={mealPriceForAirReq}
            transferPrices={transferPricesAirline}
            transferPriceForAirReq={transferPriceForAirReq}
            additionalServices={additionalServices || {}}
          />
        )}
      </div>
    </div>
  );
}

export default HotelAbout_tabComponent;
