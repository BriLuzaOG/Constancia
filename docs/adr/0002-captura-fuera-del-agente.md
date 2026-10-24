# ADR-0002 — Capturar la telemetría fuera del agente

- **Estado:** Aceptado
- **Fecha:** 2026-10-24
- **Stage:** 0

## Contexto

Un agente con capacidad de ejecución puede modificar cualquier registro que él mismo escriba. Si la evidencia depende del auto-reporte, el atacante controla la evidencia.

## Decisión

La captura ocurre en la plataforma, no en el agente:

- **Harness/middleware** intercepta tool calls, decisiones y errores.
- **Egress gateway** observa conexiones de red y accesos a credenciales.
- El agente no tiene credenciales de escritura sobre el store de evidencia ni sobre la trust zone.

En el MVP el harness es propio; en Stage 1 se reemplaza por OpenTelemetry.

## Consecuencias

**Positivas**
- Un agente comprometido puede intentar acciones, pero no puede escribir su propio diario.
- El punto de captura es único y auditable.

**Negativas**
- Todo agente debe ejecutarse dentro del harness. Un agente fuera de él queda fuera de la evidencia, y eso hay que declararlo.
- El harness se vuelve un componente crítico de disponibilidad.

## Alternativas descartadas

- **SDK de auto-instrumentación dentro del agente:** el atacante lo desactiva o lo salta.
- **Logs del proveedor del modelo:** no son evidencia controlada por la organización ni verificables por un tercero.
