# Small Shop Web

Sitio de Small Shop Web con tres ejemplos terminados. Es HTML, CSS y JavaScript sin nada que instalar, así que funciona tal cual en GitHub Pages.

```
index.html                 Página principal (ES/EN, vista previa en vivo, precios, contacto)
ejemplos/barberia.html     Ejemplo del paquete Grande: Barbería El Filo (negocio ficticio, solo en español)
ejemplos/restaurante.html  Ejemplo del paquete Grande: El Fogón de Titi (negocio ficticio, solo en español)
ejemplos/salon/            Ejemplo del paquete Pro: Salón Pomarrosa, 5 páginas en español e inglés (negocio ficticio)
.nojekyll                  Le dice a GitHub Pages que publique los archivos tal cual
```

## Publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `small-shop-web`).
2. Sube todos los archivos de esta carpeta a la raíz del repositorio, incluyendo la carpeta `ejemplos`.
3. En el repositorio ve a **Settings → Pages**.
4. En **Build and deployment**, escoge **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`. Guarda.
5. En uno o dos minutos el sitio sale en `https://TU-USUARIO.github.io/small-shop-web/`.

## Conectar tu dominio (cuando lo compres)

1. En **Settings → Pages → Custom domain**, escribe `smallshopweb.com` y guarda. GitHub crea un archivo `CNAME`.
2. En Namecheap, en **Advanced DNS** del dominio, añade los registros que indica la guía de GitHub: [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
3. Cuando GitHub verifique el dominio, marca **Enforce HTTPS**.

## Cambiar datos

- Teléfono y correo: en `index.html`, en el script, `PHONE` y `MAIL` están guardados al revés y en base64 para que los bots no los recojan. Para cambiarlos, codifica el valor al revés en base64 (por ejemplo `printf %s "NUMERO" | rev | base64`).
- Precios y textos: están en `index.html`, en el HTML y en el objeto `T` del script (una versión `es` y otra `en`).
- Ejemplo Pro (salón): cada página está en su carpeta (`servicios/`, `galeria/`, `resenas/`, `contacto/`). El texto en español está en el HTML de cada página; el inglés, los servicios, el horario y las reseñas están en `ejemplos/salon/assets/salon.js`. Si cambias un texto, cámbialo en los dos idiomas.

## Claude API para clientes

El sitio también es una puerta a la API de Claude (`worker/index.js`). Tus clientes pueden usar Claude en sus apps de dos maneras, con la misma dirección:

- **Con tu clave de Anthropic.** Les das una clave de Small Shop Web (`ssw_live_...`). Sus peticiones salen con tu clave de Anthropic, que nunca ven. Cada petición se mide al precio de lista de Anthropic (sin recargo) y queda guardada para que les cobres a fin de mes. Puedes ponerle un límite mensual y limitar desde qué sitios web se usa.
- **Con su propia clave.** Si mandan una clave `sk-ant-...` (guardada en los secretos de su app), la petición pasa directo a Anthropic, sin medir ni guardar nada, y Anthropic les cobra a ellos.

La guía para tus clientes está en `docs/ai-api.md`.

### Activarlo (una sola vez)

1. Crea la base de datos y copia el `database_id` que te da:
   ```
   npx wrangler d1 create small-shop-web-ai
   ```
2. En `wrangler.jsonc`, quita las `//` de la línea `d1_databases` y pega el `database_id`.
3. Crea las tablas:
   ```
   npx wrangler d1 execute small-shop-web-ai --remote --file worker/schema.sql
   ```
4. Guarda tus secretos (te pide el valor; no lo escribas en ningún archivo):
   ```
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put ADMIN_TOKEN
   ```
   `ADMIN_TOKEN` es una contraseña larga que inventas tú (por ejemplo `openssl rand -base64 32`).
5. Publica: `npx wrangler deploy`.

Mientras no hagas esto, el sitio funciona igual y las claves `ssw_` responden "not set up yet". Las claves propias (`sk-ant-`) funcionan desde ya.

### Manejar las claves de tus clientes

Todas llevan `-H "authorization: Bearer TU_ADMIN_TOKEN"`.

| Qué | Petición |
|---|---|
| Crear una clave | `POST /api/admin/keys` con `{"name": "Barbería El Filo", "monthly_cap_usd": 20, "allowed_origins": ["https://barberiaelfilo.com"]}` |
| Ver claves y gasto del mes | `GET /api/admin/keys` |
| Cambiar límite, sitios o nombre | `PATCH /api/admin/keys/key_...` con los campos a cambiar (`"monthly_cap_usd": null` quita el límite) |
| Desactivar una clave | `POST /api/admin/keys/key_.../revoke` |
| Uso para cobrar | `GET /api/admin/usage?month=2026-11` (por cliente y por modelo, en dólares) |

Ejemplo:
```
curl -X POST https://smallshopweb.com/api/admin/keys -H "authorization: Bearer TU_ADMIN_TOKEN" -d '{"name":"Barbería El Filo","monthly_cap_usd":20}'
```
La clave sale una sola vez; solo se guarda su huella (SHA-256). Si se pierde, desactívala y crea otra.

- `allowed_origins` vacío (lo normal) quiere decir que la clave solo sirve desde un servidor. Pon un sitio ahí solo si el cliente la usa desde el navegador, y siempre con límite mensual: cualquiera que abra su página puede ver la clave.
- El límite se revisa antes de cada petición, así que la última petición del mes puede pasarse un poco.
- Los precios están en `PRICES`, al principio de `worker/index.js`. Revísalos contra [claude.com/pricing](https://claude.com/pricing) cuando Anthropic los cambie. Solo los modelos de esa tabla se pueden usar con tu clave.
- Lo que tú pagas a Anthropic puede salir un poco distinto de lo medido (por ejemplo, peticiones que fallan a mitad). Compara con tu consola de Anthropic al cobrar.
