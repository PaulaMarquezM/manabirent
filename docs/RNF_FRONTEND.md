# Verificación de requisitos no funcionales del frontend

## RNF-06/07 — Diseño responsivo

La pantalla principal se valida en estos anchos de referencia:

| Ancho | Navegación | Resultados | Criterio de aceptación |
| --- | --- | --- | --- |
| 360 px | Menú compacto | 1 columna | Sin desplazamiento horizontal |
| 768 px | Menú compacto | 2 columnas | Sin desplazamiento horizontal |
| 1366 px | Navegación completa | 4 columnas | Sin desplazamiento horizontal |

Los controles interactivos principales tienen un área mínima de 44 px y los filtros cambian de una a tres columnas según el espacio disponible.

## RNF-05 — Optimización de carga

- Cada página se carga mediante `React.lazy` y `Suspense`.
- El mapa solo se descarga al activar la vista de mapa o abrir una ubicación.
- Vite genera paquetes independientes para React, Supabase, iconos y mapas.
- Las imágenes de las tarjetas usan carga diferida y decodificación asíncrona.

Comprobación:

```sh
npm run build
```

El resultado debe mostrar archivos separados para cada página y un paquete `maps` independiente del archivo de entrada.

## RNF-11 — Modularidad

- `useDisclosure` concentra el comportamiento abrir/cerrar de menús y paneles.
- `usePropertyFilters` concentra estado, actualización y filtrado de inmuebles.
- `PageLoader`, `Navbar`, `PropertyCard`, `ProtectedRoute` y `MapView` son componentes reutilizables.

Comprobación de calidad:

```sh
npm run lint
```

## RNF-10 — Compatibilidad

El proyecto declara soporte para las dos últimas versiones estables de Chrome, Edge, Firefox y Safari, además de Safari 13.1 o superior. Vite transpila a ES2018 y Autoprefixer procesa el CSS según `browserslist`.
