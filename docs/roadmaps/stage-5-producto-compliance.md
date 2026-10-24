# Stage 5 — Producto y compliance

- **Estado:** Pendiente
- **Ventana:** Semana 10+
- **Objetivo de salida:** el sistema se vende, se audita y se integra sin que el cliente escriba criptografía.
- **Depende de:** Stage 4 cerrado
- **Habilita:** operación comercial

## Alcance

### Incluye

1. **Exportadores de reportes** para EU AI Act (record-keeping, Art. 12), SOC 2 e ISO 27001.
2. **API pública** de verificación y consulta.
3. **SDK** para integrar el harness en stacks ajenos.
4. **Portal de auditor** con reportes verificables y cadena de custodia.
5. **Documentación de cumplimiento** y plantillas de evidencia.
6. **Onboarding self-service** para pilotos.

### Excluye

- Certificaciones formales: requieren auditoría externa, no solo producto.

## Criterios de salida

- [ ] Un auditor externo verifica un reporte sin acceso a la infraestructura del cliente.
- [ ] El SDK sella eventos en un stack que no es TypeScript.
- [ ] Existe un mapeo documentado entre requisitos del EU AI Act y artefactos del sistema.
- [ ] Un piloto completa el onboarding sin asistencia del equipo.
- [ ] La API pública tiene rate limits y documentación de errores.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El EU AI Act cambia o se interpreta distinto por país | Mapeo por artículo, revisión legal externa, no prometer certificación |
| El SDK fragmenta el schema de eventos | Versionar el schema desde Stage 0 y mantener compatibilidad |
| El portal de auditor filtra datos entre clientes | Revisión de seguridad dedicada antes del primer cliente |
