import {
  NOTIFICATION_MASTER_KEYS,
  emailKey,
  sitePushKey,
} from "../Components/Blocks/SettingsSidebar/notificationSections.js";

// 30 ключей: мастер + два канала на каждое из десяти событий.
// Канал уходит true только при включённом мастере — правило перенесено
// из SettingsSidebar без изменений.
export function buildNotificationPayload(state) {
  const payload = {};
  for (const master of NOTIFICATION_MASTER_KEYS) {
    const enabled = !!state?.[master];
    payload[master] = enabled;
    payload[emailKey(master)] = enabled && !!state?.[emailKey(master)];
    payload[sitePushKey(master)] = enabled && !!state?.[sitePushKey(master)];
  }
  return payload;
}
