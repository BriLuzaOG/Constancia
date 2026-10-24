# Stage 3 — Criptografía de producción

- **Estado:** Pendiente
- **Ventana:** Semana 4-6
- **Objetivo de salida:** las llaves y firmas cumplen un estándar defendible ante una auditoría externa.
- **Depende de:** Stage 2 cerrado
- **Habilita:** Stage 4

## Alcance

### Incluye

1. **Reemplazar `@noble/post-quantum` por una implementación auditada** (liboqs, OpenSSL 3.5+ o proveedor con certificación FIPS).
2. **HSM o KMS** para la llave de la trust zone; los agentes nunca la ven.
3. **Rotación de llaves** con solapamiento y verificación de firmas antiguas.
4. **Keys pineadas:** rechazar de entrada un anclaje firmado con una llave desconocida.
5. **Verificación de firma** en el verificador y, opcionalmente, en el contrato.
6. **Runbook de compromiso de llave**, probado en simulacro.

### Excluye

- Federación multi-org.
- Checkpoint mainnet diario.

## Criterios de salida

- [ ] La llave privada nunca está en el mismo host que el proceso de sellado en producción.
- [ ] Un anclaje firmado con una llave no registrada es rechazado y alertado.
- [ ] La rotación no invalida firmas históricas.
- [ ] Existe un runbook de compromiso de llave probado en un simulacro.
- [ ] La interfaz de firma permite cambiar de backend sin tocar el sealer.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| HSM/KMS añade costo y complejidad operativa | Empezar con KMS cloud; HSM físico solo si un cliente lo exige |
| PQ auditado tiene API distinta a noble | Aislar la firma detrás de una interfaz propia desde Stage 0 |
