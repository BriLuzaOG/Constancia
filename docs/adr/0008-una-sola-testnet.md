# ADR-0008 — Una sola testnet; mainnet solo con wallet probada

- **Estado:** Aceptado
- **Fecha:** 2026-10-24
- **Stage:** 0

## Contexto

La guía contempla Sepolia para el demo y un anclaje en mainnet como acto final. Cada red adicional es una dependencia operativa más: faucet, RPC, saldo, explorador.

## Decisión

- **Una sola testnet** (Sepolia o Base Sepolia) para todo el demo.
- **Mainnet es opcional** y solo se ejecuta si existe una wallet con fondos y el flujo fue probado antes del sábado 24 a las 12:00.
- Si no se prueba, **la promesa se elimina del pitch**. No se menciona mainnet.

## Consecuencias

**Positivas**
- Menos superficie de fallo operativo en vivo.
- El pitch no promete nada que no se pueda mostrar.

**Negativas**
- Sin mainnet se pierde el remate "verificable para siempre". Se compensa mostrando la verificación pública en testnet con la misma mecánica.

## Alternativas descartadas

- **Sepolia más mainnet más L2:** tres faucets, tres RPCs, tres formas de fallar.
