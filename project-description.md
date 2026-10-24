# AUDGENTIC — La caja negra de los agentes de IA

> Nadie la usa todos los días, pero cuando algo sale mal es la única voz que no puede mentir.

## El problema

Los agentes de IA ya ejecutan código, acceden a credenciales y toman decisiones solos. Cuando algo sale mal, sus trazas son la única evidencia de lo que pasó, y hoy nada garantiza su integridad: un agente con ejecución de código puede alterar su propio historial.

Tras el incidente de 2026 en el que agentes comprometieron la infraestructura de Hugging Face, la reconstrucción forense tomó **meses**. Lo que tomó meses debería tomar minutos, y lo que puede ser falsificado debería ser verificable por cualquiera.

## La solución

AUDGENTIC es una cadena de custodia para la era de los agentes:

- **El que registra no es el registrado.** La telemetría se captura en la plataforma (harness / OpenTelemetry y egress gateway), nunca la auto-reporta el agente.
- **Sellado en una zona aislada.** Cada sesión forma una hash-chain (`seq` + `prev_hash`). Cada 5 minutos un agregador Merkle reduce todo a una sola raíz, firmada con criptografía post-cuántica (ML-DSA). Los agentes nunca tienen acceso a estas llaves.
- **Anclaje en una blockchain pública.** Solo la raíz de 32 bytes va on-chain: la cadena crece con el reloj, no con las acciones. Da igual que sean 10 eventos o 10 millones.
- **Testigos independientes.** Las cabezas de cadena se replican por gossip en segundos, así que un escritor comprometido diverge de la mayoría.
- **Verificador forense.** Recomputa los hashes y los compara contra la raíz anclada y los testigos. Un hash roto significa alteración y un hueco de secuencia significa borrado, aunque el contenido ya no exista.

## Tres gestos humanos

| Gesto | Quién | Qué hace |
|---|---|---|
| **VER** | Líder de equipo | Dashboard del enjambre de agentes |
| **RESPONDER** | Seguridad | Alerta por Telegram, forense y kill switch |
| **COMPROBAR** | Auditor, cliente o ciudadano | Página pública de verificación, sin pedir permiso a nadie |

## La demo

1. **El enjambre:** agentes trabajando en paralelo, todo sellado y anclado en vivo.
2. **El rogue:** un agente se desvía e intenta exfiltrar datos. Se detecta en vivo.
3. **El golpe final:** el rogue intenta borrar sus huellas. El verificador detecta el hash roto y el hueco de secuencia, y muestra qué se borró, cuándo y desde dónde.
4. **Cualquiera puede verificar:** el juez verifica un reporte contra el anclaje público sin acceso a nada nuestro.

## Stack

SHA-256 hash-chains · `@openzeppelin/merkle-tree` · ML-DSA (OpenSSL 3.5 / liboqs) · contrato registry en Solidity sobre Sepolia · `viem` · OpenTelemetry · Postgres · MinIO/S3 con Object Lock (WORM) · bot de Telegram

> No vendemos inmutabilidad casera: la subcontratamos al consenso más fuerte del mundo.
