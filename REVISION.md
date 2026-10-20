# Revisión del sitio «Manual de Digitación GES 2024»

Fecha: 20 de octubre de 2026 · Repositorio: `cmorenoglobal/manual-ges`

## Resumen en 30 segundos

- **El sitio es de bajo riesgo.** Es una página estática: no tiene servidor propio, base de datos, contraseñas ni formularios que envíen datos a algún lado. Lo que puede salir mal es acotado.
- **No encontré datos de pacientes ni claves** en el código, en el Excel ni en el historial de git. El Excel solo contiene reglas de digitación, códigos de prestación y establecimientos. Lo único personal es tu nombre en las propiedades del archivo Excel (autor: «Carlos Moreno»), lo que es normal.
- **El mayor riesgo real está en tu cuenta de GitHub**, no en el código: quien entre a tu cuenta puede cambiar el manual. Protégela con verificación en dos pasos (2FA).
- **Ya corregí en esta rama** (cada cambio en su propio commit, probado en un navegador): el escape de datos del Excel (XSS), la verificación de integridad del script externo (SRI), una política de seguridad de contenido (CSP), el service worker que no funcionaba en GitHub Pages y varios temas de accesibilidad.

## Qué cambié (ya incluido en esta rama)

| Commit | Qué hace | Por qué |
|---|---|---|
| SRI en SheetJS | El navegador verifica que la librería descargada desde cdnjs sea exactamente la esperada | Si el CDN fuera atacado o alterado, el script modificado no se ejecuta |
| Escape de datos (XSS) | El contenido de las celdas del Excel se muestra como texto, no como HTML | Antes, una celda con `<img src=x onerror=...>` ejecutaba código en el navegador de quien abriera el sitio |
| CSP + referrer | Solo se permiten scripts del propio sitio y de cdnjs; la página solo se conecta a su propio dominio; se bloquean plugins y formularios externos | Segunda barrera: aunque algo malicioso se colara, tendría muy poco margen |
| Service worker | Rutas relativas y estrategia «red primero» | Con rutas `/index.html` la instalación fallaba en GitHub Pages (el sitio vive en `/manual-ges/`). Ahora la app funciona sin conexión con la última versión vista, y nunca muestra una versión vieja si hay internet |
| Accesibilidad | Pestañas como botones (usables con teclado), etiquetas asociadas a los filtros, anuncios para lectores de pantalla, aviso que no se sale de la pantalla en celular | Ver sección de mejoras |

Pruebas realizadas (Chromium, pantalla de celular 390 px, sitio servido en `/manual-ges/` como GitHub Pages): carga automática del Excel, las 5 pestañas, búsqueda, exportación a Excel, intento de XSS (queda como texto y no se ejecuta), registro del service worker y cero errores de consola o de CSP.

No se borró contenido ni se tocaron datos clínicos: `manual.xlsx` está sin cambios.

---

## 1. Seguridad y disponibilidad

Escala: **Alto** = conviene hacerlo ya; **Medio** = hacerlo pronto; **Bajo** = deseable.

### 🔴 Alto — Cuenta de GitHub como único punto de control

- **Situación:** la rama `main` no tiene protección y tú eres el único colaborador (admin). Los cambios se suben con «Add files via upload» directo a `main`, que se publica al instante.
- **Cómo se explotaría:** si alguien obtiene tu contraseña de GitHub (filtración, phishing, reutilización de clave), puede reemplazar `manual.xlsx` o `index.html` y el sitio mostraría reglas de derivación falsas a toda la red, sin que nadie lo note.
- **Cómo arreglarlo (lo haces tú en GitHub, 10 minutos):**
  1. Activar **2FA** en tu cuenta: *Settings → Password and authentication → Two-factor authentication* (idealmente con app o llave de seguridad, no SMS).
  2. Revisar *Settings → Sessions* y *Applications* y quitar lo que no reconozcas.
  3. Opcional: en el repo, *Settings → Branches → Add rule* para `main` con «Do not allow force pushes» y «Do not allow deletions». Así nadie puede borrar el historial (que es tu respaldo).

### 🟡 Medio — Librería SheetJS 0.18.5 con vulnerabilidades conocidas

- **Situación:** se usa `xlsx` 0.18.5 (de 2022). Tiene dos fallas publicadas: CVE-2023-30533 (*prototype pollution* al leer un archivo manipulado; corregida en 0.19.3) y CVE-2024-22363 (*ReDoS*, un archivo especialmente armado puede congelar la pestaña; corregida en 0.20.2). Las versiones nuevas ya no están en npm ni en cdnjs, solo en `cdn.sheetjs.com`.
- **Cómo se explotaría:** solo leyendo un Excel malicioso. En este sitio el Excel viene de tu propio repositorio, o lo elige el usuario a mano si falla la carga. El impacto realista es bajo (congelar o alterar la página de quien abre ese archivo), por eso es Medio y no Alto.
- **Cómo arreglarlo:** descargar `xlsx.full.min.js` versión 0.20.3 desde <https://cdn.sheetjs.com/>, guardarlo en el repositorio (por ejemplo `vendor/xlsx.full.min.js`) y cambiar la línea `<script src=...>` a ese archivo local. Además elimina la dependencia de un CDN externo (si cdnjs cae, el sitio sigue funcionando). Si se hace, se puede quitar `https://cdnjs.cloudflare.com` de la CSP. No lo hice yo porque desde este entorno no pude descargar la versión nueva de forma verificable.

### 🟡 Medio — Sin respaldo ni control de cambios del Excel

- **Situación:** `manual.xlsx` es la única fuente de datos y se reemplaza entero en cada subida. Git guarda versiones anteriores, pero un Excel es binario: no se ve qué celdas cambiaron.
- **Riesgo:** un error al editar el Excel (borrar una fila, cambiar un nombre de hoja) se publica sin aviso. Si se renombra una hoja (por ejemplo «APS 2» → «APS2»), esa pestaña queda vacía sin mensaje de error.
- **Cómo arreglarlo:** ver la sección de mantenimiento de datos más abajo.

### 🟢 Bajo — XSS por contenido del Excel (**corregido**)

- Antes: el texto de las celdas se insertaba con `innerHTML`. Una celda con HTML/JavaScript se ejecutaba en el navegador del usuario. Explotable solo por quien pudiera editar `manual.xlsx` en el repo, o por alguien que convenza a un usuario de cargar un Excel manipulado.
- Ahora: todo el contenido pasa por la función `esc()` y se muestra como texto.

### 🟢 Bajo — Script externo sin verificación de integridad (**corregido**)

- La versión ya estaba fija (0.18.5), pero sin `integrity`. Ahora tiene SRI: si cdnjs sirviera otro archivo, el navegador lo bloquea (y el sitio mostraría el aviso de error en vez de ejecutar código ajeno).

### 🟢 Bajo — Sin Content-Security-Policy (**corregido parcialmente**)

- Se agregó CSP mediante `<meta>`. GitHub Pages no permite configurar cabeceras HTTP, así que algunas protecciones no se pueden poner: `frame-ancestors` / `X-Frame-Options` (impedir que otro sitio muestre el tuyo dentro de un marco) y `Strict-Transport-Security`. Si algún día se necesitan, la alternativa es poner Cloudflare (gratis) delante o migrar a Cloudflare Pages / Netlify, que sí permiten cabeceras.
- La CSP aún permite `'unsafe-inline'` porque el código está todo dentro del HTML y usa `onclick=`. Para cerrarla del todo habría que mover el JavaScript a un archivo `app.js` y usar `addEventListener` (ver «Estructura del código»).

### 🟢 Bajo — Disponibilidad / que «lo boten»

- **GitHub Pages** es muy estable y absorbe ataques de tráfico (DDoS) por sí mismo; un sitio estático como este es muy difícil de botar. Límites: 100 GB de transferencia al mes y 1 GB de tamaño (el sitio pesa ~50 KB + ~900 KB de la librería); no hay riesgo práctico de alcanzarlos.
- **Dependencias externas:** si cdnjs no responde, el Excel no se puede leer y la página muestra «No se pudo cargar». Se elimina guardando la librería en el repo (ver punto de SheetJS).
- **Abuso del hosting:** no hay formularios, subida de archivos al servidor ni endpoints; nadie puede usar tu sitio para alojar contenido propio.
- **Riesgo de baja por GitHub:** solo si la cuenta se suspende. Conviene tener un respaldo del repo (por ejemplo, descargar el ZIP de vez en cuando o un *fork* en una cuenta institucional).

### 🟢 Bajo — Otros puntos revisados (sin problema)

| Revisión | Resultado |
|---|---|
| Claves, tokens, API keys en código o historial | No hay (2 commits revisados) |
| Datos personales o de pacientes | No hay. Solo tu nombre en las propiedades del Excel (*Archivo → Información → Propiedades*), puedes borrarlo si prefieres |
| Parámetros de URL, `eval`, `document.write` | No se usan |
| Formularios o endpoints | No hay; todo ocurre en el navegador del usuario |
| GitHub Actions / secretos | No hay workflows ni secretos configurados |
| Colaboradores | Solo `cmorenoglobal` (admin) |
| Archivo cargado a mano por el usuario | Se procesa solo en su navegador, no se envía a ningún lado |

---

## 2. Mejoras recomendadas

### Errores visibles

1. **Íconos de la app faltantes.** `manifest.json` apunta a `icon-192.png` e `icon-512.png`, que no existen en el repo. Al «Agregar a pantalla de inicio» en Android aparece un ícono genérico o la opción ni se ofrece. Solución: crear dos PNG cuadrados (192×192 y 512×512) con el logo y subirlos con esos nombres.
2. **Pestaña vacía sin explicación.** Si una hoja del Excel cambia de nombre, la pestaña muestra «Sin resultados con los filtros aplicados», lo que confunde. Sugerencia: si `leerHoja` no encuentra la hoja, mostrar «No se encontró la hoja "APS 2" en el Excel».
3. **Limpieza del N° PS.** `.replace('.0','')` quita la *primera* aparición de «.0» en cualquier parte. Hoy funciona porque los N° son enteros, pero un valor como «10.05» quedaría «105». Más seguro: `.replace(/\.0$/, '')`.
4. **«Actualizado: …»** muestra la hora en que se *abrió* la página, no la fecha en que se actualizó el manual. Sugerencia: mostrar la fecha de modificación del Excel (cabecera `Last-Modified` de la respuesta) o una celda «Versión / fecha» dentro del propio Excel.
5. **Título dice «2024».** Si el contenido ya es de 2025-2026, actualizar título, `description` y `manifest.json`.
6. **El botón «Actualizar»** recarga los datos pero deja la pestaña en «Glosario» y borra los filtros; sería mejor mantener la pestaña actual.

### Usabilidad en celular

- Las tablas tienen ancho mínimo de 500 px, así que en el celular hay que desplazarse de lado. Opción: en pantallas angostas, mostrar cada fila como «tarjeta» (cada columna en un renglón: *Especialidad: …, Establecimiento: …*). Es el cambio que más mejoraría el uso en el teléfono.
- El encabezado fijo más las pestañas ocupan bastante altura; se podría achicar el encabezado al hacer scroll.
- La búsqueda filtra con cada tecla; con estos volúmenes va bien, pero el botón «🔍 Buscar» sobra (se puede quitar o dejar solo como ayuda visual).
- Buscar «cancer» (sin tilde) no encuentra «cáncer». Se puede normalizar el texto quitando tildes antes de comparar (`texto.normalize('NFD').replace(/[̀-ͯ]/g,'')`).

### Accesibilidad

- ✅ Hecho: pestañas con teclado, etiquetas asociadas, anuncios para lectores de pantalla, foco visible.
- Pendiente: el gris de textos secundarios (`#5a5a7a` sobre fondos claros) y el blanco sobre naranja/verde medio quedan cerca del mínimo de contraste; revisar con <https://webaim.org/resources/contrastchecker/>.
- Pendiente: los íconos emoji en botones y títulos los leen los lectores de pantalla («carpeta abierta Estado del archivo»); se pueden envolver en `<span aria-hidden="true">`.
- Pendiente: la zona de error «Toca aquí para cargar el archivo» es un `div` clicable; mejor un `<button>` real para que funcione con teclado.

### Rendimiento

- La librería SheetJS pesa ~900 KB y se descarga en cada visita (salvo caché del navegador). Para un manual de ~250 filas es mucho. Alternativa de más impacto: convertir `manual.xlsx` a un `manual.json` al publicar (con un pequeño script o una GitHub Action) y que la página lea el JSON; la librería solo se cargaría al pulsar «Exportar Excel». La carga pasaría de ~1 MB a ~50 KB.
- `manual.xlsx?v=Date.now()` evita la caché en cada visita. Está bien para tener siempre la última versión; con el service worker nuevo, además, funciona sin conexión.

### Estructura del código

- Todo está en un solo `index.html` (CSS + HTML + JS). Para algo de este tamaño es aceptable, pero separar en `styles.css` y `app.js` facilita editarlo y permite una CSP más estricta (sin `'unsafe-inline'`).
- Reemplazar los `onclick="..."` en el HTML por `addEventListener` en el JS (mismo motivo).
- La detección de columnas «Establecimiento» y «Especialidad» busca por palabras dentro del nombre de la columna; si cambia el encabezado del Excel, los filtros quedan vacíos sin aviso. Conviene documentar los nombres de columnas esperados (ver abajo).

### Mantenimiento de los datos

- Agregar un **`README.md`** que explique: qué hojas debe tener el Excel (`Glosario`, `APS`, `APS 2`, `Derivaciones`, `Hoja1`), qué columnas son obligatorias (`N° PS`, `Nombre PS`, y las que contengan «estab» y «espec»), y que el Glosario usa las columnas A, B, D y E.
- Renombrar «Hoja1» a algo descriptivo (por ejemplo «Complementario») **en el Excel y en el código a la vez**.
- Agregar en el Excel una celda con **fecha de vigencia / versión** y mostrarla en la página, para que quien consulta sepa si está viendo la última versión.
- Para ver qué cambió entre versiones, una opción simple es mantener también una copia en CSV (una por hoja); git sí muestra las diferencias de un CSV línea por línea.
- Considerar subir los cambios mediante *pull request* (como este) en vez de directo a `main`: deja registro de qué cambió y permite revisarlo antes de publicar.

---

## Lista de tareas sugerida (en orden)

1. [ ] Activar 2FA en GitHub *(Alto, 10 min)*
2. [ ] Revisar y fusionar este PR
3. [ ] Proteger `main` contra borrado/force-push *(5 min)*
4. [ ] Guardar SheetJS 0.20.3 en el repo en vez de usar cdnjs *(Medio)*
5. [ ] Subir los íconos `icon-192.png` e `icon-512.png`
6. [ ] Crear `README.md` con el formato esperado del Excel
7. [ ] Vista en tarjetas para celular y búsqueda sin tildes
8. [ ] (Opcional) Convertir el Excel a JSON al publicar
