# Seguimiento de búsquedas por intención (HU-02)

Objetivo: ver cada lunes si llegan más búsquedas con intención de compra, no solo más visitas.

## 1. Filtros de consulta (Search Console → Rendimiento → Resultados de búsqueda)

Añadir filtro → **Consulta** → **Expresión regular personalizada** → *Coincide con la expresión regular*.

| Filtro | Intención | Expresión regular |
| ------ | --------- | ----------------- |
| A1 | Asesorías y gestorías | `asesor\|gestor\|despacho` |
| A2 | Compra de software | `precio\|cuesta\|coste\|tarifa\|programa\|software\|probar\|gratis\|alternativa\|mejor\|app` |
| B | Informativa (cómo hacer facturas) | `c[oó]mo (hacer\|rellenar\|numerar\|se hace)\|plantilla\|modelo\|ejemplo\|calcul\|generador\|facturae` |

Notas:

- Search Console usa sintaxis RE2 y las consultas ya llegan en minúsculas.
- En B se usa `c[oó]mo` en lugar de `como` para contar también las búsquedas escritas con tilde.
- Search Console no guarda filtros con nombre: guarda la URL del informe con cada filtro aplicado
  (marcadores del navegador "GSC A1", "GSC A2", "GSC B") o crea los tres filtros en Looker Studio.

## 2. Línea base (3 meses)

Para cada filtro: rango de fechas **Últimos 3 meses**, comparar desactivado, y anotar en la hoja
los totales de clics, impresiones y posición media. Esa fila es la línea base.

## 3. Rutina de los lunes

Para cada filtro, rango **Últimos 7 días** y anotar una fila nueva en la hoja.

Plantilla de la hoja: [search-console-seguimiento.csv](search-console-seguimiento.csv).

## 4. Relacionado con HU-05

Tras desplegar la nueva `/verifactu/cuando-es-obligatorio`: Search Console → **Inspección de URLs**
→ pegar `https://novafactura.es/verifactu/cuando-es-obligatorio` → **Solicitar indexación**.
Repetir para `/verifactu`, `/verifactu/sanciones` y `/verifactu/software-garante`.
