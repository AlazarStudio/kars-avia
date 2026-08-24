import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  getCookie,
  GET_ROOM_KIND_SEASONS,
  CREATE_ROOM_KIND_SEASON,
  UPDATE_ROOM_KIND_SEASON,
  DELETE_ROOM_KIND_SEASON,
} from "../../../../graphQL_requests.js";

/**
 * Данные сезонных цен категории номера.
 *
 * Список приходит с бэка отсортированным по startDate asc — своей сортировки
 * не заводим, иначе при равных датах порядок разойдётся с сервером.
 *
 * Ошибки мутаций НЕ глотаем: пробрасываем наверх, показывает их компонент.
 *
 * @param {string} roomKindId
 */
export default function useRoomKindSeasons(roomKindId) {
  const token = getCookie("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_ROOM_KIND_SEASONS, {
    variables: { roomKindId },
    skip: !roomKindId,
    fetchPolicy: "cache-and-network",
    context: auth,
  });

  const [createSeason] = useMutation(CREATE_ROOM_KIND_SEASON, { context: auth });
  const [updateSeason] = useMutation(UPDATE_ROOM_KIND_SEASON, { context: auth });
  const [deleteSeason] = useMutation(DELETE_ROOM_KIND_SEASON, { context: auth });

  const run = useCallback(
    async (fn) => {
      setSaving(true);
      try {
        await fn();
        // Ошибку перечитывания наверх не пускаем: она не значит, что не
        // сохранилось. Иначе компонент показал бы «Не удалось сохранить сезон»
        // и оставил форму заполненной — пользователь нажал бы ещё раз и получил
        // отказ по пересечению с сезоном, который уже создан. Провалившийся
        // refetch и так выставляет error у useQuery, а в UI есть ветка ошибки
        // с кнопкой «Повторить».
        await refetch().catch(() => {});
      } finally {
        setSaving(false);
      }
    },
    [refetch]
  );

  const create = useCallback(
    (input) =>
      run(() => createSeason({ variables: { input: { roomKindId, ...input } } })),
    [run, createSeason, roomKindId]
  );

  const update = useCallback(
    (id, input) => run(() => updateSeason({ variables: { id, input } })),
    [run, updateSeason]
  );

  const remove = useCallback(
    (id) => run(() => deleteSeason({ variables: { id } })),
    [run, deleteSeason]
  );

  return {
    seasons: data?.roomKindSeasons ?? [],
    loading,
    error,
    refetch,
    saving,
    create,
    update,
    remove,
  };
}
