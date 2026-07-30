# Aplicación de la corrección de seguridad en Supabase

La migración conserva los datos y reemplaza las políticas de prototipo que
permitían leer información personal sin iniciar sesión.

## Orden de despliegue

1. En Supabase, abrir **SQL Editor** con una cuenta administradora.
2. Copiar y ejecutar todo el archivo
   `supabase/migrations/20260729_harden_security.up.sql`.
3. Confirmar que la ejecución termina con `Success` y sin errores.
4. Publicar después esta versión del frontend. El catálogo nuevo depende de la
   vista `propiedades_publicas` creada por la migración.

No se debe colocar la `service_role` en `.env.local`, Vite ni el navegador. La
aplicación solo necesita la clave pública `anon`; RLS y las funciones RPC se
encargan de autorizar cada operación.

## Comprobaciones mínimas

- Sin iniciar sesión, `perfiles`, `solicitudes`, `contratos` e `incidencias` no
  deben devolver filas mediante la API.
- Sin iniciar sesión, `propiedades_publicas` debe devolver solo propiedades
  disponibles y nunca email, teléfono, identificadores de usuarios ni motivos
  de moderación.
- Un arrendatario solo debe ver sus solicitudes y contratos.
- Un arrendador solo debe editar sus propiedades y procesar las solicitudes que
  recibió.
- Registrar una cuenta con el rol `admin` en los metadatos no debe crear un
  administrador. Ese rol solo se asigna administrativamente en la base.
- Aprobar una solicitud debe crear el contrato, aprobar la solicitud y marcar
  el inmueble como arrendado en una sola operación.

## Reversión de emergencia

El archivo `supabase/rollback/20260729_harden_security.down.sql` deja las
tablas cerradas y retira las interfaces nuevas. Es un rollback deliberadamente
seguro: la aplicación quedará temporalmente sin acceso en vez de restaurar las
políticas públicas vulnerables.
