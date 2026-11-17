# DCCO ResearchHub

Buscador interno para encontrar publicaciones de la Universidad de las Fuerzas Armadas ESPE relacionadas con una idea de investigación. El investigador describe su propuesta en lenguaje natural; la aplicación consulta OpenAlex y OpenAIRE y reúne los resultados en una tabla.

## Funciones

- **Buscar por idea:** consulta semántica en OpenAlex y búsqueda por palabras en OpenAIRE, ambas restringidas a publicaciones con autores afiliados a ESPE. Permite filtrar por año y revisar identificador, título, DOI, descripción, enlace, línea de investigación y laboratorio en una tabla. También muestra los autores y la fuente de cada registro.
- **Acceso interno:** inicio de sesión con cuentas locales. Un administrador puede crear y activar o desactivar usuarios.
- **Clasificación interna opcional:** el administrador puede asignar una línea institucional y un laboratorio DCCO a cada resultado, sin crear manualmente el artículo. Los investigadores ven esas asignaciones identificadas como internas.

OpenAlex usa el identificador institucional de ESPE `I118946981`; OpenAIRE usa su ROR `https://ror.org/05j136930` y restringe los resultados al tipo «Article». Se consultan hasta 50 registros por fuente, en páginas de diez, y se eliminan duplicados con el mismo DOI. La etiqueta «Afiliación DCCO mencionada» aparece solo cuando el texto de afiliación en OpenAlex menciona expresamente al departamento. La afiliación general a ESPE por sí sola no confirma pertenencia al DCCO. Las columnas «Línea de investigación» y «Laboratorio» quedan «Sin asignar» hasta que un administrador las revise. Las opciones proceden de los [listados oficiales de líneas de ESPE](https://investigacion.espe.edu.ec/lineas-de-investigacion/) y [laboratorios DCCO](https://dcco.espe.edu.ec/laboratorios-informacion/); OpenAlex y OpenAIRE no entregan por sí solos esa clasificación institucional.

## Sobre Scopus y Google Scholar

Scopus tiene una [API oficial](https://dev.elsevier.com/sc_apis.html), pero para usarla en esta aplicación la institución debe facilitar una clave y confirmar los permisos de acceso. [Elsevier indica](https://dev.elsevier.com/tecdoc_api_authentication.html) que una clave por sí sola no habilita los datos. Google Scholar no ofrece acceso masivo ni una API pública oficial para este flujo; por eso no se extraen resultados de su sitio. [Ayuda de Google Scholar](https://scholar.google.com/intl/en-US/scholar/help.html).

Para solicitar Scopus al ingeniero o a la biblioteca: pedir la clave de la API, la habilitación de **Scopus Search** y el identificador Scopus de la afiliación ESPE. Con esos datos podría añadirse como tercera fuente, manteniendo el mismo filtro institucional y la misma tabla.

## Inicio rápido

Requiere Docker Desktop con Compose.

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Cambie SESSION_PASSWORD y POSTGRES_PASSWORD en .env antes de iniciar.
docker compose up --build -d
docker compose ps
```

Abra <http://localhost:3000>. Compose inicia PostgreSQL, aplica la migración, crea las cuentas de prueba si aún no existen y arranca la aplicación. Los datos se guardan en el volumen `postgres_data`.

Para uso frecuente, añada una clave gratuita de OpenAlex en `OPENALEX_API_KEY` dentro de `.env`. La clave se envía solo desde el servidor. Sin clave se pueden realizar consultas básicas con un presupuesto menor. OpenAIRE permite consultas sin clave, con un límite menor para acceso anónimo. Las respuestas se almacenan en caché durante 15 minutos. [Documentación de OpenAlex](https://help.openalex.org/api/authentication/) · [API de OpenAIRE](https://graph.openaire.eu/docs/apis/graph-api-v4/) · [Condiciones de OpenAIRE](https://graph.openaire.eu/docs/apis/terms/).

## Cuentas de prueba

El seed crea estas cuentas solo para desarrollo local:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@dcco.local` | `DccoDemo2026!` |
| Usuario | `investigador@dcco.local` | `DccoDemo2026!` |

Antes de un despliegue institucional, cambie estas credenciales y configure sus propias cuentas.

## Estructura

```text
src/app/                         Páginas y rutas HTTP
src/components/articles/         Formulario y tabla de resultados
src/features/articles/           Unión, deduplicación y clasificación interna opcional
src/features/openalex/           Consulta y adaptación de OpenAlex
src/features/openaire/           Consulta y adaptación de OpenAIRE
src/lib/auth/                    Sesiones y roles
src/lib/db/                      Cliente Prisma
src/lib/http.ts                  Errores y protección de mutaciones
src/lib/client-api.ts            Peticiones JSON desde el navegador
prisma/                          Esquema, migración y seed
tests/                           Reglas de búsqueda y flujo HTTP
```

Las tablas antiguas de artículos, revisiones y clasificaciones permanecen en PostgreSQL para conservar datos existentes. Sus módulos y rutas ya no forman parte de la aplicación. El seed no crea artículos ni clasificaciones nuevas; solo elimina los artículos ficticios antiguos que todavía tienen título `[DEMO]` y enlace de ejemplo.

## Verificación

```powershell
docker compose exec app npm test
docker compose exec app npm run test:flow
docker compose exec app npm run lint
```

`test:flow` comprueba autenticación, permisos de usuarios y validación del buscador sin depender de respuestas externas. Para comprobar resultados reales, realice una búsqueda desde la aplicación con acceso a internet. Si una fuente falla, la tabla muestra los registros de la otra e informa qué fuente no respondió.
"# DCCO-RESEARCHHUB" 
