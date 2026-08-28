// Maps an expense_categories.icon_key (from the DB / demo fixtures) to the
// design-guide SVG assets copied into public/assets/icons.

export function categoryListIcon(iconKey: string) {
  return `/assets/icons/listicon-${iconKey}.svg`;
}

export function categoryTagIcon(iconKey: string) {
  return `/assets/icons/tag-${iconKey}.svg`;
}

export function categoryPlainIcon(iconKey: string) {
  return `/assets/icons/icon-${iconKey}.svg`;
}

export const NAV_ICONS = {
  chartActive: "/assets/icons/nav-chart-active.svg",
  chartInactive: "/assets/icons/nav-chart-inactive.svg",
  listActive: "/assets/icons/nav-list-active.svg",
  listInactive: "/assets/icons/nav-list-inactive.svg",
  calcActive: "/assets/icons/nav-calc-active.svg",
  calcInactive: "/assets/icons/nav-calc-inactive.svg",
  plusActive: "/assets/icons/nav-plus-active.svg",
  plusInactive: "/assets/icons/nav-plus-inactive.svg",
  fabCamera: "/assets/icons/nav-fab-camera.svg",
} as const;

export const BG_PURPLE = "/assets/bg-purple.svg";
