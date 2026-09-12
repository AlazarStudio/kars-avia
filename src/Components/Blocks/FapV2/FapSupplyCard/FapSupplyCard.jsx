import FapSupplyCardEditor from "./FapSupplyCardEditor";
import FapSupplyCardView from "./FapSupplyCardView";

// Карточка «Поставка» на странице воды/питания: одна поставка на рейс.
// canEdit — диспетчер и заявка не заперта; showInternal — стоимость поставщику
// (только диспетчерским ролям; АК получает null с бэка).
//
// Переключатель, а не ранний return внутри одного компонента: у режима правки
// свои хуки (черновик, мутация), а поставить их после условного выхода нельзя.
export default function FapSupplyCard({
  service,
  serviceKind,
  requestId,
  color,
  canEdit,
  showInternal,
  onRefetch,
}) {
  const unitLabel = serviceKind === "WATER" ? "Напитков" : "Порций";

  if (!canEdit) {
    return <FapSupplyCardView service={service} unitLabel={unitLabel} showInternal={showInternal} />;
  }

  return (
    <FapSupplyCardEditor
      service={service}
      serviceKind={serviceKind}
      requestId={requestId}
      color={color}
      unitLabel={unitLabel}
      showInternal={showInternal}
      onRefetch={onRefetch}
    />
  );
}
