"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, createContext, useContext } from "react";
import { useSession, signOut } from "next-auth/react";

const SideNavContext = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
});

export function useSideNav() {
  return useContext(SideNavContext);
}

const NAV_ITEMS = [
  {
    label: "Rent a Vehicle",
    href: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <circle cx="18.5" cy="17.5" r="3.5" />
        <circle cx="5.5" cy="17.5" r="3.5" />
        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 11.5V14l-3-3 4-3 2 3h2" />
      </svg>
    ),
  },
  {
    label: "Public Transit",
    href: "/transit",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 21l2-4M17 21l-2-4M8 7h0M16 7h0" />
      </svg>
    ),
  },
  {
    label: "Parking",
    href: "/parking",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
      </svg>
    ),
  },
];

const BOTTOM_ITEMS = [
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
];

function NavLink({ href, icon, label, active, collapsed }: { href: string; icon: React.ReactNode; label: string; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
          : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
      }`}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export function SideNavProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SideNavContext.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      {children}
    </SideNavContext.Provider>
  );
}

export default function SideNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { collapsed, toggle } = useSideNav();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0a0a0e] border-r border-white/5 flex flex-col z-40 transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "justify-center py-5" : "justify-between px-5 py-6"}`}>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white/40 text-[9px] uppercase tracking-[0.2em]">
              The Blueprints
            </p>
            <p className="text-white font-bold text-sm mt-0.5 truncate">
              {session?.user?.name?.split(" ")[0] ?? "Dashboard"}
            </p>
          </div>
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <nav className={`flex-1 ${collapsed ? "px-2" : "px-3"} space-y-1`}>
        {!collapsed && (
          <p className="text-white/30 text-[9px] uppercase tracking-widest px-2 mb-2">
            Services
          </p>
        )}
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className={`${collapsed ? "px-2" : "px-3"} pb-4 space-y-1`}>
        <div className="border-t border-white/5 mb-3" />
        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href}
            collapsed={collapsed}
          />
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sign out" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all w-full border border-transparent ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
