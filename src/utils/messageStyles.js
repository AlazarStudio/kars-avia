// Стиль для системных (separator) сообщений в чате.
// "Запрос на отмену", "Заявка отменена" и подобные — красные.
// Остальные системные сообщения — зелёные (по умолчанию).
const CANCEL_RE = /отмен/i;

export const getSeparatorStyle = (message) => {
    if (!message?.separator) return {};
    const isCancellation = typeof message.text === "string" && CANCEL_RE.test(message.text);
    if (isCancellation) {
        return { backgroundColor: "#E5484D26", color: "#9B1C1C" };
    }
    return { backgroundColor: "#3CBC6726", color: "#3B6C54" };
};

export const getSeparatorStyleTransparent = (message) => {
    if (!message?.separator) return {};
    const isCancellation = typeof message.text === "string" && CANCEL_RE.test(message.text);
    if (isCancellation) {
        return { backgroundColor: "transparent", color: "#9B1C1C" };
    }
    return { backgroundColor: "transparent", color: "#3B6C54" };
};
