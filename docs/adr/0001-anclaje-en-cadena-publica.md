# ADR-0001 — Anclar la raíz Merkle en una cadena pública

- **Estado:** Aceptado
- **Fecha:** 2026-10-24
- **Stage:** 0

## Contexto

El sistema debe probar que un conjunto de eventos existió en un momento dado y que no fue alterado después. Si la prueba vive en infraestructura que la propia organización administra, un atacante con acceso a esa infraestructura puede reescribirla.

## Decisión

Anclar únicamente la **raíz Merkle** (32 bytes por intervalo) en una cadena pública. En el MVP: una testnet (Sepolia o Base Sepolia). El contrato solo almacena raíces, timestamps y emite eventos.

## Consecuencias

**Positivas**
- La inmutabilidad se alquila, no se administra. Reescribir el anclaje exige un ataque de red mayoritaria.
- La verificación es pública y sin permiso: cualquiera lee la raíz con un RPC.
- El costo on-chain es constante por tiempo (32 B cada intervalo), no por evento.

**Negativas**
- Dependencia de un RPC y de la disponibilidad de la red.
- Latencia de finalidad que la UI debe representar honestamente.
- Una cadena pública garantiza inmutabilidad, **no veracidad**. Ver ADR-0002 y ADR-0007.

## Alternativas descartadas

- **Blockchain privada / on-prem:** la administra el mismo equipo que se defiende del atacante. Es una base de datos con ropa de blockchain.
- **Ancla en un servicio centralizado (GitHub, S3):** el proveedor puede reescribir o borrar. No es verificable por un tercero sin confianza.
