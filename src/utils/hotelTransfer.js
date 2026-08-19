// Гостиница возит трансфер сама, когда у неё выставлена хотя бы одна цена.
// Форма проверки повторяет пункт transferPrice в hotelReadiness.js.
export function hotelProvidesTransfer(transferPrice) {
  return Boolean(
    transferPrice?.arrival > 0 || transferPrice?.departure > 0
  );
}
