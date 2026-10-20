# Manual de Digitación GES — Red Asistencial SSVSA

Página web para consultar rápido, desde el computador o el celular, cómo se digita y deriva cada problema de salud GES en la red del SSVSA.

- **Sitio:** <https://cmorenoglobal.github.io/manual-ges/> (publicado con GitHub Pages desde la rama `main`)
- **Se puede instalar en el celular:** desde el navegador, «Agregar a pantalla de inicio». Una vez abierta, también funciona sin conexión con la última versión que se vio.

Todo ocurre en el navegador de quien consulta: no hay servidor, base de datos ni formularios, y **no contiene ni debe contener datos de pacientes**.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `manual.xlsx` | **Los datos.** Lo único que hay que cambiar para actualizar el manual |
| `index.html` | La página (diseño y lógica) |
| `sw.js` | Permite usar la página sin conexión |
| `manifest.json`, `icon-*.png`, `apple-touch-icon.png` | Nombre e íconos al instalarla en el celular |
| `REVISION.md` | Revisión de seguridad y lista de mejoras pendientes |

## Cómo actualizar el manual

1. Edita `manual.xlsx` en Excel, respetando el formato de abajo (nombres de hojas y encabezados).
2. En GitHub, entra al repositorio → **Add file → Upload files** → arrastra el nuevo `manual.xlsx` (mismo nombre) → escribe en el mensaje qué cambió (por ejemplo «Actualiza derivación PS 37 a HCVB») → **Commit changes**.
3. En 1–2 minutos el sitio muestra la versión nueva. Quien ya tenga la página abierta puede pulsar **🔄 Actualizar**.

> Si algo sale mal, GitHub guarda todas las versiones anteriores: en el repositorio, abre `manual.xlsx` → **History** para ver o descargar una versión previa.

Antes de subir, revisa:

- [ ] Los nombres de las hojas no cambiaron (si cambian, esa pestaña queda vacía).
- [ ] La primera fila de cada hoja sigue siendo la de encabezados.
- [ ] No hay datos de pacientes (nombres, RUT, fichas).

## Formato del Excel

El archivo debe tener estas cinco hojas, con estos nombres exactos (mayúsculas y espacios incluidos):

| Hoja | Pestaña en la página |
|---|---|
| `Glosario` | 📋 Glosario |
| `APS` | 🏥 APS Directa |
| `APS 2` | 🔄 APS c/Derivación |
| `Derivaciones` | ➡️ Derivaciones |
| `Hoja1` | 📄 Complementario |

### Hoja `Glosario`

Se leen las columnas por **posición**, no por nombre:

| Columna | Contenido |
|---|---|
| A | Nombre completo (ej. «Confirmación Diagnóstica») |
| B | Abreviación (ej. «CD») |
| C | *(no se usa; se deja vacía)* |
| D | Código de prestación |
| E | Nombre de la prestación |

Las abreviaciones (A–B) y los códigos (D–E) son dos listas independientes; una fila puede tener solo una de las dos.

### Hojas `APS`, `APS 2`, `Derivaciones` y `Hoja1`

- La **fila 1** son los encabezados; cada columna de la hoja se muestra como columna en la tabla, con ese mismo título.
- Columnas **obligatorias**, con este nombre exacto:
  - `N° PS`: número del problema de salud.
  - `Nombre PS`: nombre del problema de salud.
- Si un PS ocupa varias filas, basta con escribir `N° PS` y `Nombre PS` en la primera; las filas siguientes vacías en esas dos columnas se asumen del mismo PS (celdas combinadas también funcionan).
- Los filtros de la página se arman solos a partir de:
  - la primera columna cuyo título contenga **«estab»** (ej. `ESTABLECIMIENTO`, `Establecimiento Destino`) → filtro *Establecimiento / Destino*;
  - la primera columna cuyo título contenga **«espec»** (ej. `ESPECIALIDAD`) → filtro *Especialidad / Unidad*.

  Si se renombran esas columnas sin esas palabras, el filtro queda vacío.
- Evita columnas con datos pero sin título: aparecen en la página como una columna sin encabezado.

Columnas actuales, como referencia:

| Hoja | Encabezados |
|---|---|
| `APS` | N° PS · Nombre PS · Beneficiario · Primer Ingreso a SIGGES · Plazo GO Primer y segundo Ingreso · Segundo Ingreso a SIGGES · Plazo GO · Tercer Ingreso SIGGES · ESTABLECIMIENTO · UNIDAD · ESPECIALIDAD · observaciones |
| `APS 2` | N° PS · Nombre PS · Beneficiario · plazo de garantia desde derivacion · se deriva para · establecimiento destino · unidad · especialidad · observaciones |
| `Derivaciones` | N° PS · Nombre PS · Acceso · Plazo de Garantia desde Derivacion · Se deriva para · Establecimiento Destino · Unidad · Especialidad · Observaciones |
| `Hoja1` | N° PS · Nombre PS · Acceso · Plazo de Garantia desde Derivacion · Se deriva para · Establecimiento Destino · Unidad · Especialidad · Observaciones |

Se pueden agregar, quitar o reordenar columnas (salvo las dos obligatorias) sin tocar el código: la página muestra lo que encuentre.

## Seguridad (lo básico)

- Mantén activa la **verificación en dos pasos (2FA)** en la cuenta de GitHub: quien entre a la cuenta puede cambiar lo que ve toda la red.
- El contenido del Excel se muestra siempre como texto, así que una celda con código no se ejecuta.
- Detalle completo y pendientes en [`REVISION.md`](REVISION.md).

## Probar cambios en tu computador (opcional)

La página necesita abrirse desde un servidor web (no con doble clic en `index.html`), porque descarga `manual.xlsx`. Con Python instalado:

```bash
python -m http.server 8000
```

y abrir <http://localhost:8000/>.
