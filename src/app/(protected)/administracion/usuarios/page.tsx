"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Th, Td } from "@/components/ui/table";
import { apiJson, jsonOptions } from "@/lib/client-api";

type User = {
  id: string; fullName: string; email: string; role: string;
  isActive: boolean; createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await apiJson<User[]>("/api/users", { cache: "no-store" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiJson<User>("/api/users", jsonOptions("POST", { fullName: name, email, password, role }));
      setMessage("Usuario creado correctamente");
      setName("");
      setEmail("");
      setPassword("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el usuario");
    }
  }

  async function toggle(user: User) {
    setError("");
    try {
      await apiJson(`/api/users/${user.id}`, jsonOptions("PATCH", { isActive: !user.isActive }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar el estado");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Administración de usuarios</h1>
        <p className="mt-1 text-slate-500">Crea cuentas y controla el acceso a la plataforma.</p>
      </header>

      <form onSubmit={create} className="card p-6">
        <h2 className="mb-5 text-lg font-bold">Crear usuario</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label htmlFor="name">Nombre completo</Label><Input id="name" className="mt-2" value={name} onChange={event => setName(event.target.value)} minLength={3} required /></div>
          <div><Label htmlFor="email">Correo</Label><Input id="email" className="mt-2" type="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>
          <div><Label htmlFor="password">Contraseña temporal (mínimo 10 caracteres)</Label><Input id="password" className="mt-2" type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={10} required /></div>
          <div>
            <Label htmlFor="role">Rol</Label>
            <select id="role" className="field mt-2" value={role} onChange={event => setRole(event.target.value)}>
              <option value="USER">Usuario</option><option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>
        <Button className="mt-5">Crear cuenta</Button>
      </form>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-brand">{message}</p>}
      <section>
        <h2 className="mb-3 text-lg font-bold">Usuarios registrados</h2>
        {loading ? <div className="card p-6">Cargando…</div> : (
          <div className="card overflow-hidden">
            <Table>
              <thead><tr><Th>Nombre</Th><Th>Correo</Th><Th>Rol</Th><Th>Estado</Th><Th>Registro</Th><Th>Acción</Th></tr></thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <Td>{user.fullName}</Td><Td>{user.email}</Td><Td>{user.role}</Td>
                    <Td>{user.isActive ? "Activo" : "Inactivo"}</Td>
                    <Td>{new Date(user.createdAt).toLocaleDateString("es-EC")}</Td>
                    <Td><Button variant="outline" size="sm" onClick={() => toggle(user)}>{user.isActive ? "Desactivar" : "Activar"}</Button></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
