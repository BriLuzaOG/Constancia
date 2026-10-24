# Evaluación de viabilidad — Platanus Hack 26

- **Fecha de evaluación:** 2026-10-24 01:54 (sábado)
- **Deadline:** 2026-10-25 10:00 (domingo)
- **Tiempo restante al momento de la evaluación:** 32.1 horas
- **Estado del repo al evaluar:** solo documentación, cero líneas de código

## Veredicto

**La idea es de 9/10. El scope completo no cabe en el tiempo. El demo recortado sí.**

La guía asume una ventana de 36 horas que ya se acortó, y asume código existente que no existe.

## Premisas verificadas

| Premisa | Resultado | Fuente |
|---|---|---|
| Incidente OpenAI / Hugging Face de julio 2026 | **Real y documentado** | [OpenAI](https://openai.com/index/hugging-face-model-evaluation-security-incident), [Timeline HF](https://huggingface.co/blog/agent-intrusion-technical-timeline), [METR](https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation), [Redwood](https://www.redwoodresearch.org/research/hugging-face-incident) |
| ML-DSA disponible sin liboqs ni OpenSSL | **Sí, en JS puro** | [@noble/post-quantum](https://www.npmjs.com/package/@noble/post-quantum) v0.7.x, FIPS-204 |

## Lo que no cabe en 32 horas

| Pieza | Por qué se difiere | Stage |
|---|---|---|
| OpenTelemetry Collector | Infra real, 3-4 h; el middleware propio cubre el demo | 1 |
| MinIO / S3 con Object Lock (WORM) | 2-3 h de configuración; el hash ya prueba integridad | 1 |
| liboqs / OpenSSL 3.5 | Fricción de sistema; `@noble/post-quantum` resuelve en 20 min | 3 |
| Gossip real (libp2p) | Trampa de tiempo clásica | 2 |
| Replicación de blobs en testigos | Requiere diseño y storage extra | 2 |
| Dashboard completo | El jurado ve tres paneles, no un producto | 1 |
| Múltiples testnets / mainnet | Cada red es un faucet y un RPC más que puede fallar | 4 |

## Riesgos operativos que matan demos

1. **Faucet de testnet sin probar.** Debe probarse antes de dormir, no el domingo a las 8 AM.
2. **URL de deploy.** Vercel no puede conectarse a un repo de organización. El mirror a repo personal debe existir antes del sábado al mediodía.
3. **Anclaje en mainnet.** Solo si hay wallet con fondos y flujo probado. Si no, se elimina del pitch.

## Correcciones de precisión para el pitch

- **"90% de agentes sin monitoreo"** no tiene fuente verificable. Quitarla o reemplazarla por un dato comprobable.
- **"Tres investigaciones externas"** son cuatro fuentes, y una de ellas es el propio OpenAI. No llamarla externa.
- **Testigos en el MVP:** replican cabezas, no blobs. Prueban que un evento existió y cuándo, **no recuperan el contenido borrado**. El guion del demo debe decirlo así.

## Regla que decide el resultado

**Feature freeze domingo 06:00.** De 06:00 a 09:00 se ensaya cinco veces y se graba un video de respaldo. Un equipo pierde más demos por ensayar a las 9:45 que por falta de features.
