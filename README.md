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

- Teléfono de WhatsApp: busca `19394086784` en `index.html` (aparece en `PHONE` y en los enlaces `wa.me`).
- Precios y textos: están en `index.html`, en el HTML y en el objeto `T` del script (una versión `es` y otra `en`).
- Ejemplo Pro (salón): cada página está en su carpeta (`servicios/`, `galeria/`, `resenas/`, `contacto/`). El texto en español está en el HTML de cada página; el inglés, los servicios, el horario y las reseñas están en `ejemplos/salon/assets/salon.js`. Si cambias un texto, cámbialo en los dos idiomas.
