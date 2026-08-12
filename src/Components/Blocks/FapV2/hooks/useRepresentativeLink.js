import { useMemo } from "react";
import { useToast } from "../../../../contexts/ToastContext";
import { canSeeExternalLinks } from "../../../../utils/access";

// Представительская PWA-ссылка для заявки: { link, canCopy, copy }.
// Используется в FapDetail и FapServicePage (байт-идентичная логика).
export function useRepresentativeLink(user, request) {
  const { success, error: notifyError } = useToast();

  const link = useMemo(() => {
    const links = request?.representativeLinks || [];
    if (!Array.isArray(links) || links.length === 0) return "";
    const byDepartment = user?.representativeDepartmentId
      ? links.find(
          (item) =>
            String(item?.representativeDepartmentId) ===
              String(user.representativeDepartmentId) && item?.linkPWA
        )
      : null;
    if (byDepartment?.linkPWA) return byDepartment.linkPWA;
    const firstWithPwa = links.find((item) => item?.linkPWA);
    return firstWithPwa?.linkPWA || "";
  }, [request?.representativeLinks, user?.representativeDepartmentId]);

  // Тот же гейт, что у гостиничных и водительских ссылок в FapServicePage: ссылка
  // выдаёт сессию внешнего представителя со ВСЕМИ заявками пары авиакомпания+аэропорт,
  // то есть это вход, а не данные. Прежнее условие `!isExternalUser` пускало к ней
  // любую внутреннюю роль, включая гостиничную, — и такая эскалация пережила бы
  // включение FAP_SCOPE_ENFORCE, потому что заявку гостиница видит законно.
  const canCopy = canSeeExternalLinks(user) && Boolean(link);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      success("Ссылка представительства скопирована");
    } catch {
      notifyError("Не удалось скопировать ссылку");
    }
  };

  return { link, canCopy, copy };
}
