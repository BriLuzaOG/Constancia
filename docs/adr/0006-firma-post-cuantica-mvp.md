# ADR-0006 — ML-DSA con @noble/post-quantum en el MVP

- **Estado:** Aceptado (MVP), revisado en Stage 3
- **Fecha:** 2026-10-24
- **Stage:** 0

## Contexto

El pitch promete firma post-cuántica (ML-DSA). La guía original proponía OpenSSL 3.5 o liboqs, lo que añade dependencias de sistema y horas de integración que el deadline no tiene.

## Decisión

Usar `@noble/post-quantum` (v0.7.x), implementación pura de JavaScript de ML-DSA (FIPS-204), sin dependencias nativas.

## Consecuencias

**Positivas**
- Cero fricción de instalación: es un paquete npm.
- API directa (`ml_dsa65.sign` / `verify`) y tamaño de firma manejable.
- Permite mostrar una firma PQ real en el demo, no una promesa.

**Negativas**
- **No es constant-time**, según declara el propio autor. No apto para producción sin revisión.
- **No tiene auditoría externa independiente**; la auditoría de abril de 2026 fue propia.
- Por eso el MVP lo presenta como "demo-grade" y Stage 3 lo reemplaza por una implementación auditada.

## Alternativas descartadas

- **liboqs / OpenSSL 3.5:** horas de integración y dependencia de la versión del sistema. Se difiere a Stage 3.
- **Ed25519 solamente:** no cumple la promesa de longevidad post-cuántica del pitch.
