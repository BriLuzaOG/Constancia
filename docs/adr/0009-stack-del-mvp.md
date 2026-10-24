# ADR-0009 — Stack del MVP

- **Estado:** Propuesto — requiere confirmación del equipo
- **Fecha:** 2026-10-24
- **Stage:** 0

## Contexto

El repo no tiene código. La decisión de stack es la más urgente del Stage 0: sin ella no arranca ningún frente.

## Propuesta

- **Lenguaje:** TypeScript en todo el stack. Un solo runtime, tipos compartidos entre sealer, verificador y UI.
- **Store:** Postgres en Docker para eventos; filesystem para blobs (CAS por hash).
- **Chain:** `viem` más un contrato mínimo en Solidity (unas 20 líneas).
- **UI:** Next.js con dos rutas: dashboard interno y página pública de verificación.
- **PQ:** `@noble/post-quantum`.
- **Alertas:** bot de Telegram (API HTTP, sin SDK).
- **Monorepo simple:** un `package.json` con workspaces. Sin Turborepo ni Nx.

## Consecuencias si se acepta

**Positivas**
- Un solo lenguaje reduce el costo de integración entre frentes.
- Next.js resuelve dashboard y página pública con el mismo deploy.

**Negativas**
- Node no es el mejor runtime para cómputo criptográfico intensivo; aceptable a esta escala.
- Postgres en Docker añade un paso de arranque; se mitiga con `docker compose up`.

## Pendiente

El equipo debe confirmar o reemplazar esta propuesta antes de escribir el primer archivo de código.
