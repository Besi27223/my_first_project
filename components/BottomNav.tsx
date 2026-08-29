"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_ICONS } from "@/lib/icons";

interface NavItem {
  href: string;
  label: string;
  fab: boolean;
  active: string | null;
  inactive: string | null;
}

const ITEMS: NavItem[] = [
  { href: "/reports", active: NAV_ICONS.chartActive, inactive: NAV_ICONS.chartInactive, label: "דוחות", fab: false },
  { href: "/list", active: NAV_ICONS.listActive, inactive: NAV_ICONS.listInactive, label: "חשבוניות", fab: false },
  { href: "/invoice/new", active: null, inactive: null, label: "חדש", fab: true },
  { href: "/calc", active: NAV_ICONS.calcActive, inactive: NAV_ICONS.calcInactive, label: "מחשבון", fab: false },
  { href: "/invoice/new", active: NAV_ICONS.plusActive, inactive: NAV_ICONS.plusInactive, label: "הוספה", fab: false },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 bg-white/96 border-t border-line flex items-end justify-around px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2"
      style={{ boxShadow: "0 -4px 20px rgba(28,10,58,.08)" }}
    >
      {ITEMS.map((item, i) => {
        const isActive = pathname === item.href || (item.href === "/invoice/new" && pathname.startsWith("/invoice"));

        if (item.fab) {
          return (
            <Link
              key={`fab-${i}`}
              href={item.href}
              aria-label="הוספת קבלה חדשה במצלמה"
              className="-mt-7 rounded-[var(--radius-tile)] bg-primary p-3.5 flex items-center justify-center"
              style={{ boxShadow: "var(--shadow-fab)" }}
            >
              <Image src={NAV_ICONS.fabCamera} alt="" width={26} height={26} />
            </Link>
          );
        }

        return (
          <Link
            key={`${item.href}-${i}`}
            href={item.href}
            aria-label={item.label}
            className="flex flex-col items-center gap-1 px-2 py-1 min-w-14"
          >
            <span
              className={`flex items-center justify-center rounded-[var(--radius-tile)] w-9 h-9 ${isActive ? "bg-primary" : ""}`}
            >
              <Image src={(isActive ? item.active : item.inactive)!} alt="" width={20} height={20} />
            </span>
            <span className={`text-[11px] font-semibold ${isActive ? "text-primary" : "text-ink-3"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
