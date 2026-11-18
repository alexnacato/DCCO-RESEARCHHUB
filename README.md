# DCCO ResearchHub

Buscador interno de publicaciones relacionadas con una idea de investigación. Consulta OpenAlex y OpenAIRE, muestra resultados de autores afiliados a la Universidad de las Fuerzas Armadas ESPE y permite que un administrador añada una clasificación institucional.

## Iniciar el sistema

Se necesita Docker Desktop con Compose. Desde la carpeta del proyecto:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Edite .env y cambie SESSION_PASSWORD y POSTGRES_PASSWORD.
docker compose up --build -d
docker compose ps
```

Abra <http://localhost:3000>. Al iniciar, Compose levanta PostgreSQL, aplica las migraciones y crea las cuentas de prueba si todavía no existen. Los datos se conservan en el volumen `postgres_data`.

| Variable en `.env` | Uso |
| --- | --- |
| `SESSION_PASSWORD` | Clave de la sesión; use una cadena aleatoria de al menos 32 caracteres. |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL. |
| `OPENALEX_API_KEY` | Clave opcional para ampliar el presupuesto de consultas a OpenAlex. |

El archivo `.env` está excluido de Git. La clave de OpenAlex se utiliza en el servidor y no se entrega al navegador. OpenAIRE se consulta sin clave. Compose publica la aplicación solo en `localhost` y configura la cookie sin el atributo `Secure`; para servirla por HTTPS hay que cambiar `COOKIE_SECURE` a `true` en `compose.yaml`.

## Credenciales de ingreso local

El proceso de inicio crea estas cuentas **solo para pruebas**:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@dcco.local` | `DccoDemo2026!` |
| Investigador | `investigador@dcco.local` | `DccoDemo2026!` |

Ingrese en <http://localhost:3000/login>. Estas cuentas están definidas en `prisma/seed.ts`: cambiar `.env` no cambia sus contraseñas, y volver a ejecutar el seed no actualiza cuentas existentes. Antes de publicar el sistema, sustituya las cuentas de prueba y sus contraseñas. El acceso usa usuarios locales; no hay inicio de sesión institucional de ESPE ni restricción automática al dominio `@espe.edu.ec`.

## Qué puede hacer cada rol

| Función | Investigador | Administrador |
| --- | --- | --- |
| Buscar por descripción de una idea y filtrar por año | Sí | Sí |
| Ver publicaciones, autores, fuente, DOI, resumen y enlaces | Sí | Sí |
| Ver línea de investigación y laboratorio asignados | Sí | Sí |
| Asignar o quitar línea de investigación y laboratorio | No | Sí |
| Crear usuarios y activar o desactivar cuentas | No | Sí |

## Proceso de búsqueda por idea

1. El usuario escribe su idea en una o dos frases (entre 10 y 2000 caracteres) y, si quiere, selecciona un año.
2. El navegador envía la idea, el año y el número de página a `GET /api/articles`. El servidor verifica la sesión y valida los datos.
3. El servidor consulta OpenAlex y OpenAIRE al mismo tiempo. Cada fuente busca la idea a su manera y aplica el filtro de afiliación a ESPE y, si se eligió, el filtro de año.
4. El sistema recibe los datos de las publicaciones, reúne las dos listas y une los registros que tienen el mismo DOI. Después añade las líneas de investigación y laboratorios que un administrador haya guardado.
5. La tabla muestra identificador, título, tipo, año, autores, fuente, DOI, resumen y enlaces. También muestra la línea y el laboratorio, o «Sin asignar» si no se han revisado. El usuario puede avanzar hasta la quinta página.

Si una fuente no responde, se muestran los resultados de la otra y se avisa cuál falló. Las líneas y los laboratorios son asignaciones internas opcionales: solo un administrador puede elegirlos de los [listados de líneas ESPE](https://investigacion.espe.edu.ec/lineas-de-investigacion/) y [laboratorios DCCO](https://dcco.espe.edu.ec/laboratorios-informacion/). Se guardan en PostgreSQL sin modificar la publicación original.

## Cómo se filtran las publicaciones de ESPE

El sistema envía la idea escrita por el usuario a dos bases de publicaciones. En ambas solicita resultados en los que **al menos un autor figure afiliado a ESPE**. Para reconocer a la universidad, cada base usa su propio identificador; estos identificadores no son contraseñas.

| Fuente | Cómo busca la idea | Cómo limita los resultados a ESPE | Qué publicaciones incluye |
| --- | --- | --- | --- |
| OpenAlex | Busca publicaciones relacionadas con el significado de la idea, aunque no usen exactamente las mismas palabras. | Pide registros con la institución ESPE identificada como `I118946981` en los datos de autoría. | Artículos y ponencias. |
| OpenAIRE | Busca la idea mediante palabras del texto ingresado. | Pide registros con el identificador ROR de ESPE `https://ror.org/05j136930` en la afiliación de un autor. | Artículos (`Article`). |

Cada fuente entrega páginas de diez resultados, con un máximo de 50 por búsqueda. Las consultas externas tienen un tiempo máximo de 12 segundos y caché de 15 minutos.

La afiliación a ESPE depende de los metadatos de OpenAlex y OpenAIRE; no se deduce del correo del usuario. La marca «DCCO mencionado» aparece únicamente si OpenAlex incluye una mención expresa del departamento en el texto de afiliación de un autor vinculado a ESPE. Una afiliación general a ESPE no demuestra pertenencia al DCCO. Scopus y Google Scholar no están integrados.

## Acceso y seguridad de las API

| Ruta | Acceso | Función |
| --- | --- | --- |
| `POST /api/auth/login` | Público | Valida credenciales e inicia sesión. |
| `POST /api/auth/logout` | Público | Elimina la sesión si existe. |
| `GET /api/auth/me` | Público | Devuelve el usuario de la sesión o `null`. |
| `GET /api/articles` | Usuario activo | Consulta ambas fuentes con `q`, `year` y `page`. |
| `GET /api/openalex` | Usuario activo | Ruta de compatibilidad que usa la misma búsqueda. |
| `POST /api/articles/annotations` | Administrador | Guarda o quita línea y laboratorio. |
| `GET`, `POST /api/users` | Administrador | Lista y crea usuarios. |
| `PATCH /api/users/:id` | Administrador | Activa o desactiva un usuario. |

- Las contraseñas se almacenan como hash con bcrypt. Tras cinco intentos fallidos para un correo en 15 minutos, el inicio de sesión responde con límite de intentos.
- La sesión usa una cookie `HttpOnly` y `SameSite=Lax`. Cada acceso protegido comprueba que la cuenta siga activa; las rutas administrativas también verifican el rol. Un administrador no puede desactivar su propia cuenta.
- Las rutas que modifican datos comprueban que el encabezado `Origin` coincida con el `Host`, y las entradas se validan antes de procesarse. Las API devuelven errores HTTP sin exponer detalles internos al cliente.
- Las consultas a OpenAlex y OpenAIRE se realizan desde el servidor. La clave opcional de OpenAlex no es una credencial para entrar al sistema.

## Verificación

```powershell
docker compose exec app npm test
docker compose exec app npm run test:flow
docker compose exec app npm run lint
```

`test:flow` verifica inicio de sesión, permisos y validación de búsqueda sin depender de las fuentes externas. Para comprobar publicaciones reales, haga una búsqueda desde la aplicación con conexión a internet.
