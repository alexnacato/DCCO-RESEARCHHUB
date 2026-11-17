"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Microscope, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiJson, jsonOptions } from "@/lib/client-api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiJson("/api/auth/login", jsonOptions("POST", { email, password }));
      router.push("/buscar");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist p-5">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <section className="flex flex-col justify-between bg-dark p-9 text-white md:p-12">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3"><Microscope /></div>
              <div>
                <strong className="block text-xl">DCCO ResearchHub</strong>
                <span className="text-sm text-emerald-100">Universidad de las Fuerzas Armadas ESPE</span>
              </div>
            </div>
            <h1 className="max-w-sm text-4xl font-bold leading-tight">Encuentra investigaciones de ESPE relacionadas con tu idea.</h1>
            <p className="mt-5 max-w-sm leading-relaxed text-emerald-100">Describe tu propuesta y descubre publicaciones institucionales que puedan ayudarte a desarrollarla.</p>
          </div>
          <p className="mt-12 flex items-center gap-2 text-sm text-emerald-100"><ShieldCheck size={17} /> Acceso institucional interno</p>
        </section>
        <section className="p-9 md:p-12">
          <div className="mb-9 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-brand"><LockKeyhole /></div>
          <h2 className="text-2xl font-bold">Iniciar sesión</h2>
          <p className="mb-8 mt-2 text-slate-500">Ingresa tus credenciales para continuar.</p>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required placeholder="usuario@espe.edu.ec" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button className="w-full" size="lg" disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
