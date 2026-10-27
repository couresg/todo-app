"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; icon: string; children?: NavLink[] };

const LINKS: NavLink[] = [
  { href: "/dashboard", label: "대시보드", icon: "▦" },
  {
    href: "/",
    label: "할 일",
    icon: "✓",
    children: [
      { href: "/board", label: "보드", icon: "" },
      { href: "/unlinked", label: "미연결", icon: "" },
    ],
  },
  { href: "/weekly", label: "주간 계획", icon: "▤" },
  { href: "/goals", label: "1년 목표", icon: "◎" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function NavBar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <nav
        aria-label="주 메뉴"
        className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:flex-col md:items-stretch md:gap-0.5 md:overflow-visible md:px-3 md:py-5"
      >
        <span className="mr-3 shrink-0 font-bold text-accent md:mb-5 md:mr-0 md:px-3 md:text-lg">Todo</span>
        {LINKS.map((l) => (
          <div key={l.href} className="flex shrink-0 items-center gap-1 md:flex-col md:items-stretch md:gap-0.5">
            <NavItem link={l} active={isActive(pathname, l.href)} />
            {l.children?.map((c) => (
              <NavItem key={c.href} link={c} active={isActive(pathname, c.href)} sub />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function NavItem({ link, active, sub }: { link: NavLink; active: boolean; sub?: boolean }) {
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm ${sub ? "md:ml-6 md:py-1.5" : ""} ${
        active ? "bg-accent text-accent-fg font-semibold" : "text-muted hover:bg-background hover:text-foreground"
      }`}
    >
      {link.icon && (
        <span aria-hidden className="w-4 text-center">
          {link.icon}
        </span>
      )}
      {link.label}
    </Link>
  );
}
