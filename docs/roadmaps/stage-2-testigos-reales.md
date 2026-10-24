# Stage 2 — Testigos reales

- **Estado:** Pendiente
- **Ventana:** Semana 3-4
- **Objetivo de salida:** un escritor comprometido es detectable por mayoría de testigos independientes, y el contenido borrado puede recuperarse desde un testigo.
- **Depende de:** Stage 1 cerrado
- **Habilita:** Stage 3

## Alcance

### Incluye

1. **Gossip real** entre testigos (libp2p o protocolo equivalente).
2. **Replicación de cabezas y blobs** en al menos dos testigos independientes.
3. **Detección de divergencia en segundos:** comparación de cabezas y alerta.
4. **Recuperación de contenido** desde un testigo tras un borrado en el store principal.
5. **Health checks y métricas** por testigo.
6. **Guion de demo actualizado:** el momento 3 ahora recupera contenido real, no solo prueba de existencia.

### Excluye

- Federación entre organizaciones.
- Testigos con incentivos económicos.

## Criterios de salida

- [ ] Dos testigos con el mismo conjunto de cabezas detectan una divergencia inyectada en menos de 10 segundos.
- [ ] Un blob borrado del store principal se recupera desde un testigo y el hash coincide.
- [ ] Un testigo caído no detiene el sellado ni la verificación.
- [ ] El demo de recuperación de contenido funciona end-to-end.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Gossip real consume más tiempo del estimado | Empezar con dos nodos y protocolo mínimo; no construir descubrimiento de pares |
| Los blobs replicados multiplican el storage | Replicar solo core y contexto, no ruido; dedup por hash |
| La mayoría de testigos es falsa porque todos corren en el mismo host | Declarar el límite en el pitch y mover un testigo a otro proveedor |
