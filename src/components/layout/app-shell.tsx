"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type User = { id: string; fullName: string; email: string; role: string };

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const linkStyle = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${active ? "bg-emerald-50 text-brand" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/buscar" className="min-w-52">
            <span className="block text-lg font-bold tracking-tight text-dark">DCCO <span className="text-brand">ResearchHub</span></span>
            <span className="block text-xs text-slate-500">Universidad de las Fuerzas Armadas ESPE</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Navegación principal">
            <Link href="/buscar" aria-current={pathname === "/buscar" ? "page" : undefined} className={linkStyle(pathname === "/buscar")}>
              <Search size={17} /> Buscar por idea
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/administracion/usuarios" aria-current={pathname === "/administracion/usuarios" ? "page" : undefined} className={linkStyle(pathname === "/administracion/usuarios")}>
                <Users size={17} /> Usuarios
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-36 truncate text-sm font-semibold text-slate-700">{user.fullName}</p>
              <p className="max-w-36 truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} aria-label="Cerrar sesión"><LogOut size={16} /> Salir</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1480px] px-5 py-7 lg:px-8 lg:py-9">{children}</main>
    </div>
  );
}
