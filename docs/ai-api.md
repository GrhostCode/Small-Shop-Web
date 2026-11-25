# Usar Claude en tu app con Small Shop Web

La API es la misma de Anthropic (Messages API). Solo cambia la dirección base y la clave, así que funcionan los SDK oficiales de Anthropic, streaming, herramientas y todo lo demás.

- **Dirección base:** `https://smallshopweb.com/api/ai`
- **Clave:** la clave de Small Shop Web que te dimos (`ssw_live_...`), **o** tu propia clave de Anthropic (`sk-ant-...`).

| | Clave Small Shop Web | Tu propia clave |
|---|---|---|
| Quién te cobra | Small Shop Web, a fin de mes | Anthropic, directo |
| Precio | El precio de lista de Anthropic, sin recargo | El de tu cuenta de Anthropic |
| Modelos | `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-fable-5-2`, `claude-opus-5`, `claude-sonnet-5` | Todos los de tu cuenta |
| Límite mensual | El que acordamos | El de tu cuenta |

Para pasar de una a otra solo cambias la clave.

## Guarda la clave en un secreto

Nunca la pongas en el código ni en el HTML. Guárdala como secreto de tu hosting y léela como variable de entorno:

- Cloudflare Workers: `npx wrangler secret put SSW_API_KEY`
- Vercel / Netlify / Render: en *Environment Variables* del proyecto
- GitHub Actions: en *Settings → Secrets and variables → Actions*
- En tu computadora: un archivo `.env` que no subes a git

## Node / TypeScript

```bash
npm install @anthropic-ai/sdk
```

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  baseURL: "https://smallshopweb.com/api/ai",
  apiKey: process.env.SSW_API_KEY, // ssw_live_... o sk-ant-...
});

const message = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Escribe una descripción corta para una barbería." }],
});
console.log(message.content);
```

## Python

```bash
pip install anthropic
```

```python
import os
import anthropic

client = anthropic.Anthropic(
    base_url="https://smallshopweb.com/api/ai",
    api_key=os.environ["SSW_API_KEY"],  # ssw_live_... o sk-ant-...
)

message = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Escribe una descripción corta para una barbería."}],
)
print(message.content)
```

## cURL

```bash
curl https://smallshopweb.com/api/ai/v1/messages \
  -H "x-api-key: $SSW_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-opus-5-5", "max_tokens": 1024, "messages": [{"role": "user", "content": "Hola"}]}'
```

## Ver lo que llevas gastado este mes

```bash
curl https://smallshopweb.com/api/ai/usage -H "x-api-key: $SSW_API_KEY"
```

## Errores que puedes ver

Vienen en el mismo formato que los de Anthropic, así que el SDK los lanza como siempre.

| Código | Qué pasa |
|---|---|
| 401 | Falta la clave, está mal o fue desactivada |
| 402 | Llegaste al límite del mes; escríbenos para subirlo |
| 403 | La petición viene de un sitio web que no está autorizado para esa clave |
| 400 | El modelo no está disponible con la clave de Small Shop Web, u otro error de la petición |

## Desde el navegador

Por defecto la clave de Small Shop Web solo funciona desde un servidor. Si de verdad necesitas llamarla desde el navegador, pídenos que autoricemos tu dominio, y ten en cuenta que cualquiera que abra tu página puede ver la clave y gastar tu límite.
