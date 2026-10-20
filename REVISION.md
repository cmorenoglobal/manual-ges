# Revisión del sitio «Manual de Digitación GES 2024»

Fecha: 20 de octubre de 2026 · Repositorio: `cmorenoglobal/manual-ges`

## Resumen en 30 segundos

- **El sitio es de bajo riesgo.** Es una página estática: no tiene servidor propio, base de datos, contraseñas ni formularios que envíen datos a algún lado. Lo que puede salir mal es acotado.
- **No encontré datos de pacientes ni claves** en el código, en el Excel ni en el historial de git. El Excel solo contiene reglas de digitación, códigos de prestación y establecimientos. Lo único personal es tu nombre en las propiedades del archivo Excel (autor: «Carlos Moreno»), lo que es normal.
- **El mayor riesgo real está en tu cuenta de GitHub**, no en el código: quien entre a tu cuenta puede cambiar el manual. Protégela con verificación en dos pasos (2FA).
- **Ya corregí en esta rama** (cada cambio en su propio commit, probado en un navegador): el escape de datos del Excel (XSS), la actualización de SheetJS a 0.20.3 guardada dentro del repo (sin CDN externo y con verificación de integridad), una política de seguridad de contenido (CSP), el service worker que no funcionaba en GitHub Pages y varios temas de accesibilidad.

## Qué cambié (ya incluido en esta rama)

| Commit | Qué hace | Por qué |
|---|---|---|
| SRI en SheetJS | El navegador verifica que la librería sea exactamente la esperada | Si el archivo fuera alterado, el script modificado no se ejecuta |
| SheetJS 0.20.3 local | Librería actualizada de 0.18.5 a 0.20.3 y guardada en `vendor/` dentro del repo | Corrige dos fallas conocidas (CVE-2023-30533 y CVE-2024-22363) y el sitio ya no depende de cdnjs |
| Escape de datos (XSS) | El contenido de las celdas del Excel se muestra como texto, no como HTML | Antes, una celda con `<img src=x onerror=...>` ejecutaba código en el navegador de quien abriera el sitio |
| CSP + referrer | Solo se permiten scripts del propio sitio; la página solo se conecta a su propio dominio; se bloquean plugins y formularios externos | Segunda barrera: aunque algo malicioso se colara, tendría muy poco margen |
| Service worker | Rutas relativas y estrategia «red primero» | Con rutas `/index.html` la instalación fallaba en GitHub Pages (el sitio vive en `/manual-ges/`). Ahora la app funciona sin conexión con la última versión vista, y nunca muestra una versión vieja si hay internet |
| Accesibilidad | Pestañas como botones (usables con teclado), etiquetas asociadas a los filtros, anuncios para lectores de pantalla, aviso que no se sale de la pantalla en celular | Ver sección de mejoras |
| Íconos | `icon-192.png`, `icon-512.png` y `apple-touch-icon.png` | El manifest los pedía y no existían |
| `README.md` | Cómo actualizar el manual y formato exacto del Excel | Ver «Mantenimiento de los datos» |
| Celular y búsqueda | Vista en tarjetas en pantallas angostas; búsqueda sin tildes ni mayúsculas | Ver «Usabilidad en celular» |

Pruebas realizadas (Chromium, pantalla de celular 390 px, sitio servido en `/manual-ges/` como GitHub Pages): carga automática del Excel, las 5 pestañas, búsqueda, exportación a Excel (y re-lectura del archivo exportado), carga manual de un Excel, intento de XSS (queda como texto y no se ejecuta), registro del service worker, uso sin conexión, ninguna petición a sitios externos y cero errores de consola o de CSP.

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

### ✅ Medio — Librería SheetJS 0.18.5 con vulnerabilidades conocidas (**corregido**)

- **Situación:** se usa `xlsx` 0.18.5 (de 2022). Tiene dos fallas publicadas: CVE-2023-30533 (*prototype pollution* al leer un archivo manipulado; corregida en 0.19.3) y CVE-2024-22363 (*ReDoS*, un archivo especialmente armado puede congelar la pestaña; corregida en 0.20.2). Las versiones nuevas ya no están en npm ni en cdnjs, solo en `cdn.sheetjs.com`.
- **Cómo se explotaría:** solo leyendo un Excel malicioso. En este sitio el Excel viene de tu propio repositorio, o lo elige el usuario a mano si falla la carga. El impacto realista es bajo (congelar o alterar la página de quien abre ese archivo), por eso es Medio y no Alto.
- **Qué se hizo:** se actualizó a la 0.20.3 y se guardó en el repositorio como `vendor/xlsx-0.20.3.full.min.js`, junto a su licencia Apache 2.0 (`vendor/xlsx-LICENSE.txt`). Se quitó cdnjs de la CSP: ahora la página solo ejecuta scripts de su propio dominio.
- **De dónde salió el archivo:** los servidores oficiales de SheetJS (`cdn.sheetjs.com`, `git.sheetjs.com`) estaban bloqueados desde el entorno de revisión, y su espejo en GitHub se quedó en la 0.18.5. Se tomó de dos re-publicaciones independientes en npm (`@e965/xlsx` y `xlsx-republish`, de autores distintos): el archivo es **idéntico byte a byte** en ambas (SHA-256 `cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41`), y `@e965/xlsx` trae un certificado de procedencia de npm (SLSA) que indica que se armó automáticamente desde el paquete oficial. Si quieres una verificación extra, descarga <https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js> en tu computador y compara su SHA-256 con el de arriba (en Windows: `certutil -hashfile archivo SHA256`).
- **Para futuras actualizaciones:** reemplazar el archivo en `vendor/`, cambiar el nombre y el `integrity` en `index.html` y el nombre en `sw.js`.

### 🟡 Medio — Sin respaldo ni control de cambios del Excel

- **Situación:** `manual.xlsx` es la única fuente de datos y se reemplaza entero en cada subida. Git guarda versiones anteriores, pero un Excel es binario: no se ve qué celdas cambiaron.
- **Riesgo:** un error al editar el Excel (borrar una fila, cambiar un nombre de hoja) se publica sin aviso. Si se renombra una hoja (por ejemplo «APS 2» → «APS2»), esa pestaña queda vacía sin mensaje de error.
- **Cómo arreglarlo:** ver la sección de mantenimiento de datos más abajo.

### 🟢 Bajo — XSS por contenido del Excel (**corregido**)

- Antes: el texto de las celdas se insertaba con `innerHTML`. Una celda con HTML/JavaScript se ejecutaba en el navegador del usuario. Explotable solo por quien pudiera editar `manual.xlsx` en el repo, o por alguien que convenza a un usuario de cargar un Excel manipulado.
- Ahora: todo el contenido pasa por la función `esc()` y se muestra como texto.

### 🟢 Bajo — Script externo sin verificación de integridad (**corregido**)

- La versión ya estaba fija (0.18.5), pero sin `integrity`. Primero se agregó SRI al script de cdnjs; luego la librería pasó a guardarse en el propio repo (ver punto anterior) y conserva su `integrity` como control adicional.

### 🟢 Bajo — Sin Content-Security-Policy (**corregido parcialmente**)

- Se agregó CSP mediante `<meta>`. GitHub Pages no permite configurar cabeceras HTTP, así que algunas protecciones no se pueden poner: `frame-ancestors` / `X-Frame-Options` (impedir que otro sitio muestre el tuyo dentro de un marco) y `Strict-Transport-Security`. Si algún día se necesitan, la alternativa es poner Cloudflare (gratis) delante o migrar a Cloudflare Pages / Netlify, que sí permiten cabeceras.
- La CSP aún permite `'unsafe-inline'` porque el código está todo dentro del HTML y usa `onclick=`. Para cerrarla del todo habría que mover el JavaScript a un archivo `app.js` y usar `addEventListener` (ver «Estructura del código»).

### 🟢 Bajo — Disponibilidad / que «lo boten»

- **GitHub Pages** es muy estable y absorbe ataques de tráfico (DDoS) por sí mismo; un sitio estático como este es muy difícil de botar. Límites: 100 GB de transferencia al mes y 1 GB de tamaño (el sitio pesa ~1 MB en total, casi todo la librería); no hay riesgo práctico de alcanzarlos.
- **Dependencias externas:** ✅ ya no hay. Antes, si cdnjs no respondía, el Excel no se podía leer. Ahora todo se sirve desde GitHub Pages.
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

1. ✅ **Íconos de la app faltantes** (corregido). `manifest.json` apuntaba a `icon-192.png` e `icon-512.png`, que no existían; al «Agregar a pantalla de inicio» aparecía un ícono genérico. Se agregaron, más `apple-touch-icon.png` para iPhone. Si se quiere usar un logo institucional, basta reemplazar esos PNG con el mismo nombre y tamaño.
2. **Pestaña vacía sin explicación.** Si una hoja del Excel cambia de nombre, la pestaña muestra «Sin resultados con los filtros aplicados», lo que confunde. Sugerencia: si `leerHoja` no encuentra la hoja, mostrar «No se encontró la hoja "APS 2" en el Excel».
3. **Limpieza del N° PS.** `.replace('.0','')` quita la *primera* aparición de «.0» en cualquier parte. Hoy funciona porque los N° son enteros, pero un valor como «10.05» quedaría «105». Más seguro: `.replace(/\.0$/, '')`.
4. **«Actualizado: …»** muestra la hora en que se *abrió* la página, no la fecha en que se actualizó el manual. Sugerencia: mostrar la fecha de modificación del Excel (cabecera `Last-Modified` de la respuesta) o una celda «Versión / fecha» dentro del propio Excel.
5. **Título dice «2024».** Si el contenido ya es de 2025-2026, actualizar título, `description` y `manifest.json`.
6. **El botón «Actualizar»** recarga los datos pero deja la pestaña en «Glosario» y borra los filtros; sería mejor mantener la pestaña actual.

### Usabilidad en celular

- ✅ Hecho: **vista en tarjetas.** En pantallas de hasta 600 px cada fila se muestra como una tarjeta, con cada columna en su propio renglón (título arriba, valor abajo); ya no hay que desplazarse de lado. Las celdas vacías no se muestran. En computador la tabla sigue igual.
- El encabezado fijo más las pestañas ocupan bastante altura; se podría achicar el encabezado al hacer scroll.
- La búsqueda filtra con cada tecla; con estos volúmenes va bien, pero el botón «🔍 Buscar» sobra (se puede quitar o dejar solo como ayuda visual).
- ✅ Hecho: **búsqueda sin tildes ni mayúsculas.** «cancer» encuentra «Cáncer» y «oftalmologia» encuentra «Oftalmología».

### Accesibilidad

- ✅ Hecho: pestañas con teclado, etiquetas asociadas, anuncios para lectores de pantalla, foco visible.
- Pendiente: el gris de textos secundarios (`#5a5a7a` sobre fondos claros) y el blanco sobre naranja/verde medio quedan cerca del mínimo de contraste; revisar con <https://webaim.org/resources/contrastchecker/>.
- Pendiente: los íconos emoji en botones y títulos los leen los lectores de pantalla («carpeta abierta Estado del archivo»); se pueden envolver en `<span aria-hidden="true">`.
- Pendiente: la zona de error «Toca aquí para cargar el archivo» es un `div` clicable; mejor un `<button>` real para que funcione con teclado.

### Rendimiento

- La librería SheetJS pesa ~950 KB. Se descarga en la primera visita; después la guardan el navegador y el service worker. Para un manual de ~250 filas es mucho. Alternativa de más impacto: convertir `manual.xlsx` a un `manual.json` al publicar (con un pequeño script o una GitHub Action) y que la página lea el JSON; la librería solo se cargaría al pulsar «Exportar Excel». La carga pasaría de ~1 MB a ~50 KB.
- `manual.xlsx?v=Date.now()` evita la caché en cada visita. Está bien para tener siempre la última versión; con el service worker nuevo, además, funciona sin conexión.

### Estructura del código

- Todo está en un solo `index.html` (CSS + HTML + JS). Para algo de este tamaño es aceptable, pero separar en `styles.css` y `app.js` facilita editarlo y permite una CSP más estricta (sin `'unsafe-inline'`).
- Reemplazar los `onclick="..."` en el HTML por `addEventListener` en el JS (mismo motivo).
- La detección de columnas «Establecimiento» y «Especialidad» busca por palabras dentro del nombre de la columna; si cambia el encabezado del Excel, los filtros quedan vacíos sin aviso. Conviene documentar los nombres de columnas esperados (ver abajo).

### Mantenimiento de los datos

- ✅ Hecho: **`README.md`** que explica cómo actualizar el manual y qué hojas debe tener el Excel (`Glosario`, `APS`, `APS 2`, `Derivaciones`, `Hoja1`), qué columnas son obligatorias (`N° PS`, `Nombre PS`, y las que contengan «estab» y «espec»), y que el Glosario usa las columnas A, B, D y E.
- Renombrar «Hoja1» a algo descriptivo (por ejemplo «Complementario») **en el Excel y en el código a la vez**.
- Agregar en el Excel una celda con **fecha de vigencia / versión** y mostrarla en la página, para que quien consulta sepa si está viendo la última versión.
- Para ver qué cambió entre versiones, una opción simple es mantener también una copia en CSV (una por hoja); git sí muestra las diferencias de un CSV línea por línea.
- Considerar subir los cambios mediante *pull request* (como este) en vez de directo a `main`: deja registro de qué cambió y permite revisarlo antes de publicar.

---

## Lista de tareas sugerida (en orden)

1. [ ] Activar 2FA en GitHub *(Alto, 10 min)*
2. [ ] Revisar y fusionar este PR
3. [ ] Proteger `main` contra borrado/force-push *(5 min)*
4. [x] Guardar SheetJS 0.20.3 en el repo en vez de usar cdnjs *(Medio)*
5. [x] Subir los íconos `icon-192.png` e `icon-512.png`
6. [x] Crear `README.md` con el formato esperado del Excel
7. [x] Vista en tarjetas para celular y búsqueda sin tildes
8. [ ] (Opcional) Convertir el Excel a JSON al publicar
