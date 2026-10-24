# Stage 4 — Escala y federación

- **Estado:** Pendiente
- **Ventana:** Semana 6-10
- **Objetivo de salida:** múltiples organizaciones pueden auditarse mutuamente sin confiar en un operador central.
- **Depende de:** Stage 3 cerrado
- **Habilita:** Stage 5

## Alcance

### Incluye

1. **Multi-tenant:** aislamiento de datos y llaves por organización.
2. **Federación permissioned** de testigos entre organizaciones.
3. **Checkpoint diario en mainnet** con costo controlado.
4. **Archivo permanente** (evaluar Arweave) para evidencia de larga vida.
5. **Ciclo de vida completo** hot → warm → cold → permanente.
6. **Panel de operador** con estado de anclaje, testigos y salud por tenant.

### Excluye

- Incentivos económicos para testigos.
- Verificación de firmas PQ en el contrato (evaluar costo de gas primero).

## Criterios de salida

- [ ] Dos organizaciones federadas detectan una divergencia inyectada por una de ellas.
- [ ] Un tenant no puede leer ni verificar datos de otro sin autorización.
- [ ] El checkpoint diario en mainnet se ejecuta siete días seguidos sin intervención.
- [ ] El costo operativo mensual está medido y documentado.
- [ ] Un testigo caído no degrada la verificación de la federación.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Mainnet cuesta más de lo previsto | Anclar solo la raíz diaria; presupuesto aprobado por adelantado |
| La federación no genera confianza real | Empezar con un auditor externo como testigo, no con un socio comercial |
| Arweave tiene costo de permanencia alto | Evaluar solo para evidencia cerrada, no para telemetría viva |
| El aislamiento multi-tenant tiene fugas | Pruebas de penetración entre tenants antes de abrir el piloto |
