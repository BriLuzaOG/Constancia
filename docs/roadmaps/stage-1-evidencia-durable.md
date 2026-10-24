# Stage 1 — Evidencia durable

- **Estado:** Pendiente
- **Ventana:** Semana 1-2 post-hackathon
- **Objetivo de salida:** la evidencia sobrevive a la pérdida del disco y la captura usa un estándar, no un harness artesanal.
- **Depende de:** Stage 0 cerrado
- **Habilita:** Stage 2

## Alcance

### Incluye

1. **Reemplazar el CAS local por S3/MinIO con Object Lock (WORM)** y versionado.
2. **Ciclo de vida** hot (0-90 días) → warm (90 días-2 años) → cold.
3. **Reemplazar el harness propio por OpenTelemetry Collector** con exporters al sealer.
4. **Tests de integración** del sealer, batcher y verificador: alteración, borrado, reordenamiento, evento duplicado.
5. **Métricas de anclaje:** heartbeat, latencia, raíces pendientes, fallos de RPC.
6. **Alarma de anclaje detenido:** si no hay raíz nueva en dos intervalos, alerta.
7. **Dashboard operativo** con historial y filtros.

### Excluye

- Gossip real.
- Federación.
- PQ de producción.

## Criterios de salida

- [ ] Un blob borrado del store no rompe la verificación (el hueco es evidencia).
- [ ] Object Lock impide borrar un objeto dentro de la retención (probado).
- [ ] Un evento emitido por OTel llega al sealer con el mismo schema que el harness propio.
- [ ] La suite de integración cubre alteración, borrado, reordenamiento y duplicado.
- [ ] La alarma de anclaje detenido se dispara en una prueba controlada.
- [ ] El dashboard muestra el estado de anclaje de las últimas 24 horas.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Object Lock en modo compliance impide operar | Governance mode en desarrollo; compliance solo en producción |
| OTel añade latencia o pierde eventos | Cola durable y comparación de conteos emitidos vs sellados |
| El costo de storage crece sin control | Dedup por hash y lifecycle desde el día uno |
