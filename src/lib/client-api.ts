type ApiError = { error?: string };

export async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null) as T | ApiError | null;

  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body ? body.error : null;
    throw new Error(message || "No se pudo completar la solicitud");
  }
  if (body === null) throw new Error("La respuesta del servidor no es válida");
  return body as T;
}

export function jsonOptions(method: "POST" | "PATCH", body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
