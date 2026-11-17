import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

const knownErrors: Record<string, { status: number; message: string }> = {
  UNAUTHORIZED: { status: 401, message: "Inicia sesión" },
  FORBIDDEN: { status: 403, message: "No tienes permisos" },
  CSRF: { status: 403, message: "Solicitud no autorizada" },
  NOT_FOUND: { status: 404, message: "Registro no encontrado" },
  SELF_DEACTIVATE: { status: 400, message: "No puedes desactivar tu propia cuenta" },
  OPENALEX_UNAVAILABLE: { status: 502, message: "OpenAlex no está disponible en este momento" },
  OPENALEX_RATE_LIMIT: { status: 503, message: "OpenAlex alcanzó su límite de consultas. Inténtalo más tarde" },
  SEARCH_UNAVAILABLE: { status: 502, message: "Las fuentes de artículos no están disponibles en este momento" }
};

export function safeMutation(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) throw new Error("CSRF");

  try {
    if (new URL(origin).host !== host) throw new Error("CSRF");
  } catch {
    throw new Error("CSRF");
  }
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Datos inválidos", details: error.flatten() }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
  }

  const code = error instanceof Error ? error.message : "";
  const known = knownErrors[code];
  if (known) return NextResponse.json({ error: known.message }, { status: known.status });

  console.error("Error de API", error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
