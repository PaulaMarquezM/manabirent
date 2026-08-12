# Modelado y base de datos - ManabíRent

Este documento reúne los diagramas técnicos de **Portoviejo 360 - ManabíRent**. Mermaid permite versionarlos y recrearlos en Lucidchart, Miro o draw.io.

## Arquitectura lógica

```mermaid
flowchart TB
    U[Usuarios web\nVisitante · Arrendatario · Arrendador · Admin]
    HOST[Netlify\nBuild Vite + HTTPS + SPA redirect]
    UI[Frontend React + Vite\nRouter · Tailwind · Leaflet · Recharts]
    AUTH[Supabase Auth]
    API[Supabase Client\nConsultas · RPC · Storage]
    DB[(PostgreSQL\nBDD relacional + RLS)]
    STORE[(Supabase Storage\nBucket propiedades)]
    U --> HOST --> UI
    UI --> AUTH
    UI --> API
    AUTH --> DB
    API --> DB
    API --> STORE
```

## Componentes y responsabilidades

```mermaid
flowchart LR
    subgraph PRESENTACION[Presentación]
      PAGES[Páginas React]
      COMPONENTS[Componentes reutilizables]
      CONTEXT[AuthContext y rutas protegidas]
    end
    subgraph APLICACION[Aplicación]
      LIB[Servicios de dominio\nproperties · contracts · admin]
      HOOKS[Hooks de filtros y estado]
    end
    subgraph INFRAESTRUCTURA[Infraestructura]
      SUPA[Cliente Supabase]
      PG[(PostgreSQL/RLS)]
      STORAGE[(Storage)]
    end
    PAGES --> COMPONENTS
    PAGES --> CONTEXT
    PAGES --> LIB
    PAGES --> HOOKS
    LIB --> SUPA
    SUPA --> PG
    SUPA --> STORAGE
```

## Flujo principal de negocio

```mermaid
sequenceDiagram
    actor A as Arrendatario
    actor R as Arrendador
    participant W as ManabíRent
    participant S as Supabase
    A->>W: Consulta y filtra propiedades
    W->>S: Lee propiedades disponibles
    A->>W: Envía solicitud de arriendo
    W->>S: Crea solicitud pendiente
    R->>W: Revisa y responde
    W->>S: Actualiza solicitud y crea contrato
    A->>W: Reporta incidencia del contrato
    W->>S: Guarda incidencia e historial
    R->>W: Actualiza el seguimiento
    W->>S: Persiste estado y respuesta
```

## Diagrama entidad-relación (DER)

```mermaid
erDiagram
    PERFILES ||--o{ PROPIEDADES : modera
    PERFILES ||--o{ SOLICITUDES : participa
    PERFILES ||--o{ CONTRATOS : participa
    PERFILES ||--o{ INCIDENCIAS : participa
    PERFILES ||--o{ RENOVACIONES : participa
    PROPIEDADES ||--o{ SOLICITUDES : recibe
    SOLICITUDES ||--o| CONTRATOS : genera
    PROPIEDADES ||--o{ CONTRATOS : se_arrienda_en
    CONTRATOS ||--o{ INCIDENCIAS : registra
    INCIDENCIAS ||--o{ INCIDENCIAS_HISTORIAL : tiene
    CONTRATOS ||--o{ RENOVACIONES : puede_extenderse
    PERFILES {
      uuid id PK
      text nombre
      text email
      text rol
      boolean cuenta_activa
    }
    PROPIEDADES {
      uuid id PK
      text titulo
      text tipo
      numeric precio
      text estado
      uuid arrendador_id FK
    }
    SOLICITUDES {
      uuid id PK
      uuid propiedad_id FK
      uuid arrendador_id FK
      uuid arrendatario_id FK
      text estado
    }
    CONTRATOS {
      uuid id PK
      uuid solicitud_id FK
      uuid propiedad_id FK
      uuid arrendador_id FK
      uuid arrendatario_id FK
      text estado
    }
    INCIDENCIAS {
      uuid id PK
      uuid contrato_id FK
      uuid propiedad_id FK
      text categoria
      text prioridad
      text estado
    }
    INCIDENCIAS_HISTORIAL {
      uuid id PK
      uuid incidencia_id FK
      text estado_anterior
      text estado_nuevo
      uuid cambiado_por FK
    }
    RENOVACIONES {
      uuid id PK
      uuid contrato_id FK
      uuid arrendador_id FK
      uuid arrendatario_id FK
      int meses
      text estado
    }
```

## Orden de ejecución

Para una instalación nueva en Supabase se recomienda ejecutar `BDD.sql`. El script mantiene la compatibilidad con el prototipo actual. Antes de producción deben sustituirse las políticas RLS permisivas por reglas basadas en `auth.uid()` y rol.
