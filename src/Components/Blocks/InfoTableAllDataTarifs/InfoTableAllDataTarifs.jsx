import React, { useState } from "react";
import classes from "./InfoTableAllDataTarifs.module.css";
import { roles } from "../../../roles";
import AttachIcon from "../../../shared/icons/AttachIcon";
import BackArrowIcon from "../../../shared/icons/BackArrowIcon";

function InfoTableAllDataTarifs({
  toggleRequestSidebar,
  toggleEditTarifsCategory,
  toggleEditMealPrices,
  requests,
  mealPrices,
  user,
  selectedContract,
  onOpenContract,
  onBack, // назад к списку договоров
  openDeleteComponent,
  openDeleteComponentCategory,
  ...props
}) {
  // локальный выбор доп. соглашения (airlinePrices[])
  const [selectedAgreement, setSelectedAgreement] = useState(null);

  // ====== Уровень 2: Детали выбранного доп. соглашения ======
  if (selectedContract && selectedAgreement) {
    const a = selectedAgreement;

    return (
      <div className={classes.detailsWrapper}>
        <div className={classes.detailsHeaderCard}>
          <div className={classes.detailsTitle}>
            <BackArrowIcon
              onClick={() => setSelectedAgreement(null)}
              width={20}
              height={14}
            />
            {a.name}
          </div>
          <div className={classes.detailsActions}>
            {/* при необходимости подставьте ссылку на скачивание именно соглашения */}
            {/* <button className={classes.primaryBtn} onClick={() => window.open(a.downloadUrl, "_blank")}>
              <img src="/downloadManifest.png" alt="" /> Скачать
            </button> */}
            {/* <AttachIcon width={19} height={19} /> */}
          </div>
        </div>

        {/* Категории — цены */}
        {user?.role !== roles.hotelAdmin && (
          <>
            <div className={classes.blockTitle}>Категории — цены</div>
            <div className={classes.pricesRow}>
              {a.prices?.priceApartment !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Апартаменты</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceApartment?.toLocaleString()} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceStudio !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Студия</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceStudio?.toLocaleString() ?? 0} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceLuxe !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Люкс</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceLuxe?.toLocaleString() ?? 0} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceOneCategory !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Одноместный</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceOneCategory?.toLocaleString()} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceTwoCategory !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Двухместный</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceTwoCategory?.toLocaleString()} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceThreeCategory !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Трехместный</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceThreeCategory?.toLocaleString()} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceFourCategory !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Четырехместный</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceFourCategory?.toLocaleString()} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceFiveCategory !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Пятиместный</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceFiveCategory?.toLocaleString()} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceSixCategory !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Шестиместный</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceSixCategory?.toLocaleString()} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceSevenCategory !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Семиместный</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceSevenCategory?.toLocaleString()} ₽
                  </span>
                </div>
              )}
              {a.prices?.priceEightCategory !== undefined && (
                <div className={classes.priceItem}>
                  <span className={classes.priceItemLabel}>Восьмиместный</span>
                  <span className={classes.priceItemValue}>
                    {a.prices.priceEightCategory?.toLocaleString()} ₽
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Питание — цены */}
        <div className={classes.blockTitle}>Питание — цены</div>
        <div className={classes.pricesRow}>
          {a.mealPrice?.breakfast !== undefined && (
            <div className={classes.priceItem}>
              <span className={classes.priceItemLabel}>Завтрак</span>
              <span className={classes.priceItemValue}>
                {a.mealPrice?.breakfast?.toLocaleString()} ₽
              </span>
            </div>
          )}
          {a.mealPrice?.lunch !== undefined && (
            <div className={classes.priceItem}>
              <span className={classes.priceItemLabel}>Обед</span>
              <span className={classes.priceItemValue}>
                {a.mealPrice?.lunch?.toLocaleString()} ₽
              </span>
            </div>
          )}
          {a.mealPrice?.dinner !== undefined && (
            <div className={classes.priceItem}>
              <span className={classes.priceItemLabel}>Ужин</span>
              <span className={classes.priceItemValue}>
                {a.mealPrice?.dinner?.toLocaleString()} ₽
              </span>
            </div>
          )}
        </div>

        {/* Аэропорты */}
        {a.airports && a.airports.length > 0 && (
          <>
            <div className={classes.airportListTitle}>Аэропорты:</div>
            <div className={classes.pricesRow}>
              {a.airports.map((ap) => (
                <div className={classes.priceItem} key={ap.id}>
                  <span className={classes.priceItemLabel}>
                    {ap.airport.code || ""}
                  </span>
                  <span className={classes.priceItemValue}>
                    {ap.airport.city} — {ap.airport.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ====== Уровень 1: Карточка договора с плитками доп. соглашений ======
  if (selectedContract) {
    const contract = selectedContract;

    return (
      <div className={classes.detailsWrapper}>
        <div className={classes.detailsHeaderCard}>
          <div className={classes.detailsTitle}>
            <BackArrowIcon onClick={onBack} width={20} height={14} />
            {contract.name}
          </div>
          <div className={classes.detailsActions}>
            <button
              className={classes.primaryBtn}
              onClick={() => window.open(contract.downloadUrl, "_blank")}
            >
              <img src="/downloadManifest.png" alt="" /> Скачать договор
            </button>
            {/* <AttachIcon width={19} height={19} />
            <img
              src="/editPassenger.png"
              alt="Редактировать договор"
              title="Редактировать"
              onClick={() => toggleEditTarifsCategory(contract)}
            />
            <img
              src="/deletePassenger.png"
              alt="Удалить договор"
              title="Удалить"
              onClick={() => toggleEditTarifsCategory(contract)}
            /> */}
          </div>
        </div>

        <div className={classes.blockTitle}>Дополнительные соглашения</div>
        <div className={classes.agreementsRow}>
          {/* <div className={classes.priceItem}>
              <span className={classes.priceItemLabel}>Завтрак</span>
              <span className={classes.priceItemValue}>
                {a.mealPrice?.breakfast?.toLocaleString()} ₽
              </span>
            </div> */}
          {contract.airlinePrices?.map((ag) => (
            <div
              key={ag.id}
              className={classes.airportItem}
              onClick={() => setSelectedAgreement(ag)}
            >
              <div
                className={classes.priceItemLabel}
                style={{ textAlign: "center" }}
              >
                {ag.name}
              </div>
              {/* лёгкий саммари — можно убрать/заменить */}
              {/* <div className={classes.agreementMeta}>
                {(ag.prices?.priceOneCategory ??
                  ag.prices?.priceTwoCategory ??
                  ag.prices?.priceApartment ??
                  0) > 0 && (
                  <span>
                    от{" "}
                    {(ag.prices.priceOneCategory ??
                      ag.prices.priceTwoCategory ??
                      ag.prices.priceApartment
                    )?.toLocaleString()}{" "}
                    ₽
                  </span>
                )}
                {ag.mealPrice &&
                  (ag.mealPrice.breakfast ||
                    ag.mealPrice.lunch ||
                    ag.mealPrice.dinner) && <span>• питание</span>}
              </div> */}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ====== Список договоров ======
  return (
    <div className={classes.contracts}>
      {requests?.map((item, index) => (
        <div
          className={classes.contractRow}
          key={item.id ?? index}
          onClick={() => onOpenContract(item)}
        >
          <div className={classes.contractRowHeader}>
            <span className={classes.contractRowTitle}>{item.name}</span>
            <div
              className={classes.contractRowActions}
              onClick={(e) => e.stopPropagation()}
            >
              {/* <img
                src="/editPassenger.png"
                alt="Редактировать договор"
                title="Редактировать"
                onClick={() => toggleEditTarifsCategory(item)}
              />
              <img
                src="/deletePassenger.png"
                alt="Удалить договор"
                title="Удалить"
                onClick={() => toggleEditTarifsCategory(item)}
              /> */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default InfoTableAllDataTarifs;
