# Fuentes de datos (uso interno)

Estas fuentes respaldan la sección **"Las mejores tasas del mercado"** (`src/lib/market.js`).
No se muestran en la página, pero son las que permiten verificar cada cifra.

## Tasas

Todas vienen de la **Superintendencia Financiera de Colombia (SFC)**, publicadas como datos
abiertos en datos.gov.co. La página las consulta en vivo desde el navegador (API Socrata, sin
token, con CORS abierto); no hay tasas escritas a mano.

| Producto | Conjunto de datos | Actualización | Enlace |
|---|---|---|---|
| Vivienda No VIS / VIS, Vehículo, Libre inversión, Libranza | Tasas de interés activas por tipo de crédito (`qzsc-9esp`) | Semanal (se publica ~1 semana después del corte) | https://www.datos.gov.co/d/qzsc-9esp |
| CDT 90 / 180 / 360 días | Tasas de interés de captación (`axk9-g2nh`) | Diaria | https://www.datos.gov.co/d/axk9-g2nh |

### Cómo se calcula el ranking

- **Créditos:** último `fecha_corte` disponible del producto, solo `tipo_de_persona = 'Natural'`.
  Tasa por entidad = promedio ponderado por monto desembolsado:
  `sum(tasa_efectiva_promedio × montos_desembolsados) / sum(montos_desembolsados)`.
  Se exige un mínimo de créditos por entidad en la semana (10 en vivienda, 20 en los demás)
  para que una entidad con 1 o 2 créditos no distorsione el ranking. Orden: tasa más baja primero.
- **CDT:** `uca = 1` y `subcuenta` 70 / 110 / 130 (= 90 / 180 / 360 días), promedio ponderado por
  monto de los últimos 7 días hasta el último corte. Se excluyen las entidades oficiales de
  segundo piso (`tipoentidad = 22`), que no atienden al público. Orden: tasa más alta primero.
- Se muestran las **5 mejores** por producto (`TOP_N`).
- La consulta exacta de cada lista se arma en `buildQueryUrl()`; `data.queryUrl` la conserva
  por si hay que auditar una cifra.

Nota técnica: en `axk9-g2nh` un alias SoQL llamado `tasa` choca con la columna y da HTTP 400;
por eso se usa `tasa_pond`.

## Enlaces a cada entidad

- Clave de cada entidad: `tipo_entidad-codigo_entidad` (códigos SFC, iguales en ambos conjuntos).
- `links` lleva a la **página del producto donde se solicita** (vivienda, vehículo, libre
  inversión, libranza, CDT). Si una entidad no publica página para ese producto, se usa su
  sitio oficial (`site`) y el botón dice "Sitio oficial" en vez de "Solicitar" / "Abrir CDT".
- Verificados el **10 nov 2026**: cada enlace se abrió en Chrome y se comprobó que la página
  corresponde al producto.
- Sitios que bloquean el acceso automatizado o desde fuera de Colombia (Bancamía, Serfinanza,
  Falabella, JFK, Banco Unión, Tuya, KOA, Coopcentral): sus enlaces se confirmaron con los
  resultados indexados del propio dominio oficial.
- Sin página de CDT para personas: RCI Colombia (Mobilize) y Corficolombiana; enlazan al sitio oficial.
- La banca de personas de Itaú pasó al Banco de Bogotá (ago 2026); Itaú conserva la banca
  corporativa, por eso solo tiene enlace de CDT.

## Logos

`public/logos/<tipo>-<codigo>.png` (96 × 96 px). Son los íconos oficiales de cada entidad
(apple-touch-icon / favicon de su sitio, o el símbolo recortado del logo vectorial del sitio
cuando el ícono era de baja resolución). Banco Coopcentral no publica un ícono utilizable y se
muestra con sus iniciales. Si llega una entidad nueva sin logo, también se muestran iniciales.

## Revisión periódica

Los bancos cambian sus URL con frecuencia. Conviene revisar los enlaces de `ENTITIES` cada
pocos meses y cuando aparezca en el ranking una entidad nueva (se verá con el botón
"Buscar sitio oficial").
