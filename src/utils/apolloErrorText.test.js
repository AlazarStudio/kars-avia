import { test } from "node:test";
import assert from "node:assert/strict";
import { apolloErrorText } from "./apolloErrorText.js";

test("apolloErrorText: доменная ошибка резолвера — первое звено цепочки", () => {
  const e = {
    graphQLErrors: [{ message: "Сезон пересекается с уже существующим периодом" }],
    message: "Response not successful",
  };
  assert.equal(
    apolloErrorText(e),
    "Сезон пересекается с уже существующим периодом"
  );
});

test("apolloErrorText: HTTP 400 до GraphQL-слоя — берём networkError.result.errors", () => {
  // Ровно та ветка, ради которой цепочка длиннее одного звена:
  // graphQLErrors пуст, а причина лежит в теле ответа.
  const e = {
    graphQLErrors: [],
    networkError: {
      result: { errors: [{ message: "Variable \"$input\" got invalid value" }] },
      message: "Response not successful: Received status code 400",
    },
  };
  assert.equal(apolloErrorText(e), 'Variable "$input" got invalid value');
});

test("apolloErrorText: сеть легла — networkError.message", () => {
  const e = { graphQLErrors: [], networkError: { message: "Failed to fetch" } };
  assert.equal(apolloErrorText(e), "Failed to fetch");
});

test("apolloErrorText: обычная ошибка — message", () => {
  assert.equal(apolloErrorText(new Error("Что-то пошло не так")), "Что-то пошло не так");
});

test("apolloErrorText: пустая ошибка → фолбэк по умолчанию", () => {
  assert.equal(apolloErrorText(undefined), "Ошибка при сохранении");
  assert.equal(apolloErrorText({}), "Ошибка при сохранении");
});

test("apolloErrorText: свой фолбэк вместо умолчания", () => {
  assert.equal(apolloErrorText(null, "Не удалось удалить сезон"), "Не удалось удалить сезон");
});
