import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_HOTEL_TRANSFER_PRICE,
  getCookie,
} from "../../../../graphQL_requests";
import { isHotelScoped, scopedHotelId } from "../../../utils/access";
import { hotelProvidesTransfer } from "../../../utils/hotelTransfer";
import {
  HOTEL_RESTRICTED_SERVICE_KEYS,
  isServiceHiddenForUser,
} from "./fapServiceVisibility";

// Инфраструктура правила fapServiceVisibility: «возит ли трансфер гостиница
// самого пользователя» решает цена в её карточке, а не заявка, поэтому за
// правилом всегда стоит отдельный запрос. Он был скопирован в трёх экранах
// почти дословно, а гейту нужны ещё две точки — вместо четвёртой и пятой копии
// один хук.
//
// `providesTransfer` пока цена грузится — `false`, то есть «не возит»: обратный
// порядок (сначала показать, потом убрать) давал бы вспышку плитки трансфера у
// гостиницы, которой он не положен, и уносил бы в книгу отчёта чужие листы.
//
// `ready` отделён от `providesTransfer` именно поэтому: по «не возит в запас»
// нельзя редиректить — так выкинуло бы и гостиницу-перевозчика, у которой ответ
// ещё в пути. Уводить со страницы можно только после ответа.
export function useHotelServiceVisibility(user) {
  const hotelScoped = isHotelScoped(user);
  const ownHotelId = scopedHotelId(user);

  const { data, loading } = useQuery(GET_HOTEL_TRANSFER_PRICE, {
    context: { headers: { Authorization: `Bearer ${getCookie("token")}` } },
    variables: { hotelId: ownHotelId },
    skip: !hotelScoped || !ownHotelId,
  });

  const providesTransfer =
    !loading && hotelProvidesTransfer(data?.hotel?.transferPrice);
  const ready = !hotelScoped || !loading;

  // useCallback, чтобы предикат не рвал мемоизацию у потребителей: в FapDetail
  // он попадает в зависимости useMemo со списком плиток.
  const isHidden = useCallback(
    (serviceKey) => isServiceHiddenForUser(serviceKey, user, providesTransfer),
    [user, providesTransfer]
  );

  // Готовый список для книги отчёта: обе точки скачивания фильтруют один и
  // тот же набор ключей, вместо повторения isServiceHiddenForUser на месте.
  const hiddenServiceKeys = useMemo(
    () =>
      HOTEL_RESTRICTED_SERVICE_KEYS.filter((key) =>
        isServiceHiddenForUser(key, user, providesTransfer)
      ),
    [user, providesTransfer]
  );

  return { ready, providesTransfer, isHidden, hiddenServiceKeys };
}
