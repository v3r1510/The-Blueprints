"use client";

import SideNav, { SideNavProvider, useSideNav } from "@/components/SideNav";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSideNav();

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      <SideNav />
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "ml-16" : "ml-56"} relative overflow-hidden`}>
        {children}
      </main>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SideNavProvider>
      <ShellInner>{children}</ShellInner>
    </SideNavProvider>
  );
}
