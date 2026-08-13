// Конвертер внутреннего секционного состояния AccessPermissionsPanel
// в плоский accessMenu (все 32 ключа) для бэка.
export const buildAccessPayload = (s) => ({
  requestMenu: !!s?.squadron?.access,
  requestCreate: !!s?.squadron?.create,
  requestChat: !!s?.squadron?.chat,
  requestUpdate: !!s?.squadron?.edit,

  transferMenu: !!s?.transfer?.access,
  transferCreate: !!s?.transfer?.create,
  transferUpdate: !!s?.transfer?.edit,
  transferChat: !!s?.transfer?.chat,

  reserveMenu: !!s?.passengers?.access,
  reserveCreate: !!s?.passengers?.create,
  reserveUpdate: !!s?.passengers?.edit,
  reserveUpdateCompleted: !!s?.passengers?.editCompleted,

  userMenu: !!s?.users?.access,
  userCreate: !!s?.users?.add,
  userUpdate: !!s?.users?.edit,

  personalMenu: !!s?.employees?.access,
  personalCreate: !!s?.employees?.add,
  personalUpdate: !!s?.employees?.edit,

  contracts: !!s?.contracts?.access,
  contractCreate: !!s?.contracts?.create,
  contractUpdate: !!s?.contracts?.edit,

  analyticsMenu: !!s?.analytics?.access,
  analyticsUpload: !!s?.analytics?.export,

  airlineMenu: !!s?.aboutAirlines?.access,
  airlineUpdate: !!s?.aboutAirlines?.edit,

  reportMenu: !!s?.reports?.access,
  reportCreate: !!s?.reports?.create,

  organizationMenu: !!s?.organization?.access,
  organizationCreate: !!s?.organization?.create,
  organizationUpdate: !!s?.organization?.edit,
  organizationAddDrivers: !!s?.organization?.addDrivers,
  organizationAcceptDrivers: !!s?.organization?.acceptDrivers,
});

// Полный набор «всё включено» — сид для новой должности, когда нет меню отдела.
export const ALL_TRUE_ACCESS = {
  requestMenu: true, requestCreate: true, requestUpdate: true, requestChat: true,
  transferMenu: true, transferCreate: true, transferUpdate: true, transferChat: true,
  personalMenu: true, personalCreate: true, personalUpdate: true,
  reserveMenu: true, reserveCreate: true, reserveUpdate: true,
  reserveUpdateCompleted: true,
  analyticsMenu: true, analyticsUpload: true,
  reportMenu: true, reportCreate: true,
  userMenu: true, userCreate: true, userUpdate: true,
  airlineMenu: true, airlineUpdate: true,
  contracts: true, contractCreate: true, contractUpdate: true,
  organizationMenu: true, organizationCreate: true, organizationUpdate: true,
  organizationAddDrivers: true, organizationAcceptDrivers: true,
};
