import assert from "node:assert/strict";

const origin = process.env.TEST_ORIGIN ?? "http://localhost:3000";
const validIdea = "Detección de ataques de phishing en correos universitarios";

async function request(path: string, method = "GET", body?: unknown, cookie?: string) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(method !== "GET" ? { origin } : {}),
      ...(cookie ? { cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0] ?? ""
  };
}

async function login(email: string) {
  const result = await request("/api/auth/login", "POST", { email, password: "DccoDemo2026!" });
  assert.equal(result.status, 200, `login ${email}: ${JSON.stringify(result.data)}`);
  assert.ok(result.cookie);
  return result.cookie;
}

async function main() {
  const ideaPath = `/api/articles?q=${encodeURIComponent(validIdea)}`;
  assert.equal((await request(ideaPath)).status, 401);

  const user = await login("investigador@dcco.local");
  const admin = await login("admin@dcco.local");
  assert.equal((await request("/api/users", "GET", undefined, user)).status, 403);
  assert.equal((await request("/api/users", "GET", undefined, admin)).status, 200);

  // La validación debe responder antes de llamar a las fuentes externas.
  assert.equal((await request("/api/articles?q=corta", "GET", undefined, user)).status, 400);
  assert.equal((await request(`${ideaPath}&page=6`, "GET", undefined, user)).status, 400);
  assert.equal((await request("/api/articles/annotations", "POST", {
    articleKey: "doi:10.1234/test", researchLine: null, laboratory: null
  }, user)).status, 403);

  const id = Date.now().toString(36);
  const created = await request("/api/users", "POST", {
    fullName: "Nuevo Usuario de Prueba",
    email: `nuevo-${id}@dcco.local`,
    password: "ClaveSegura2026!",
    role: "USER"
  }, admin);
  assert.equal(created.status, 201);
  assert.equal((await request("/api/users", "POST", {
    fullName: "No permitido", email: `otro-${id}@dcco.local`, password: "ClaveSegura2026!", role: "ADMIN"
  }, user)).status, 403);

  console.log("Flujo de acceso, administración y validación de búsqueda: OK");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
