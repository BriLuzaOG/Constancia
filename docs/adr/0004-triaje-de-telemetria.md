# ADR-0004 — Triaje de telemetría en core, contexto y ruido

- **Estado:** Aceptado
- **Fecha:** 2026-10-24
- **Stage:** 0

## Contexto

No toda la telemetría es evidencia. Sellar diez mil heartbeats por hora no aporta valor forense y multiplica el costo.

## Decisión

Tres niveles:

- **Core (siempre, completo):** tool calls con argumentos, comandos, accesos y credenciales, decisiones, errores, autenticación. Hash-chain más blob completo.
- **Contexto (siempre, hash más blob):** prompts, outputs de tools, contenido RAG, razonamiento. Hash en cadena, contenido en CAS.
- **Ruido (agregados):** heartbeats, retries, métricas. Contadores e histogramas por hora; se sella el resumen.

## Consecuencias

**Positivas**
- Costo proporcional al valor forense, no al volumen bruto.
- El schema core se mantiene pequeño y legible.

**Negativas**
- La clasificación es una decisión humana que puede equivocarse. Un evento mal clasificado como ruido se pierde como evidencia.
- Cambiar la clasificación después del hecho no reescribe el pasado; solo aplica hacia adelante.

## Alternativas descartadas

- **Sellar todo:** costo y ruido sin valor forense.
- **Muestreo aleatorio:** un ataque puede esconderse justo en la muestra descartada.
