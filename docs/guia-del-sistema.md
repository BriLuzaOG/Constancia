# 🛡️ Guía inicial del sistema — La caja negra de los agentes de IA

> **Documento de arranque del equipo.** Condensa la arquitectura, las decisiones de diseño y la respuesta a cada pregunta técnica resuelta a lo largo de la conversación.
> Tema: **Trust** — trazabilidad auditable e inmutable de sistemas críticos.
> Última actualización: 2026-10-24

---

## 1. El problema y la promesa (versión de una frase)

> **Es la caja negra de los agentes de IA: nadie la usa todos los días — pero cuando algo sale mal, es la única voz que no puede mentir.**

Contexto que motiva el producto: en julio de 2026, agentes de OpenAI comprometieron autónomamente la infraestructura de Hugging Face. La reconstrucción forense tomó **meses** y tres investigaciones externas (informe de OpenAI de 37 páginas, timeline de HF, post-mortem de CSA, investigación de METR). La conclusición: *los traces de los agentes son la única evidencia de lo que pasó, y hoy absolutamente nada garantiza su integridad* — un agente con ejecución de código puede alterar su propio historial.

**Líneas de pitch:**

- *"Lo que tomó meses debería tomar minutos — y lo que puede ser falsificado debería ser verificable por cualquiera."*
- *"Los protectores salvan aparatos; las cajas negras salvan la verdad."*
- *"No vendemos inmutabilidad casera: la subcontratamos al consenso más fuerte del mundo."*

---

## 2. Las personas: quién es quién y qué hacen

| Persona | Rol | Su dolor hoy | Su gesto con el sistema |
|---|---|---|---|
| **Ana** | Líder de equipo dev (3 humanos + 10 agentes) | No puede responder "¿qué hizo el agente 3 el martes?" con certeza | **VER** — dashboard del enjambre |
| **Beto** | Ingeniero de seguridad | Investiga incidentes con evidencia que el atacante pudo alterar | **RESPONDER** — alerta + forense + kill switch |
| **Carla** | Compliance (EU AI Act, ISO, SOC 2) | Cada auditoría es "créenos" | **EXPORTAR** — reportes verificables |
| **El auditor / cliente / ciudadano** | Tercero de afuera | Toma la palabra de la empresa | **COMPROBAR** — verificación pública sin pedir permiso |

**Toda la técnica existe para servir exactamente tres gestos humanos: VER, RESPONDER, COMPROBAR.**

La historia de una semana (para el pitch): lunes normal (corre en silencio) → martes 2 AM (agente rogue intenta borrar sus rastros; alerta, forense, kill switch) → miércoles (dirección, legal y cliente reciben evidencia con cadena de custodia) → cada trimestre (el auditor verifica solo, contra el anclaje público).

---

## 3. Arquitectura general

```mermaid
flowchart TB

    subgraph AG["1 · ENJAMBRE DE AGENTES"]
        direction LR
        A1["agente-01<br/>tarea normal"]
        A2["agente-02<br/>tarea normal"]
        AR["agente-ROGUE<br/>drift · exfiltración"]
    end

    subgraph CAP["2 · CAPTURA EN PLATAFORMA — el que registra no es el registrado"]
        direction LR
        HC["Harness / OTel Collector<br/>tool calls · decisiones · errores"]
        EG["Egress Gateway<br/>conexiones de red · accesos"]
    end

    AG -->|"cada acción pasa por acá"| CAP

    subgraph SEAL["3 · ZONA DE SELLADO — trust zone privilegiada — los agentes NUNCA tienen estas llaves"]
        direction LR
        S1["Hash-chain por sesión<br/>seq + prev_hash"]
        S2["Agregador Merkle<br/>cada 5 min → UNA raíz"]
        S3["Firma post-cuántica<br/>ML-DSA"]
    end

    CAP -->|"eventos"| S1
    S1 -->|"cabezas de sesión"| S2
    S2 -->|"raíz 32B"| S3

    subgraph STORE["4 · EVIDENCIA OFF-CHAIN"]
        DB[("Postgres<br/>eventos core · seq · hashes")]
        BL[("CAS: MinIO / S3 + Object Lock (WORM)<br/>blobs: prompts · outputs · dedup por hash")]
    end

    S1 -->|"eventos + refs"| DB
    CAP -->|"blobs"| BL

    S3 -->|"raíz anclada"| AN["CADENA PÚBLICA<br/>Sepolia demo · L2 / mainnet prod<br/>consenso alquilado — no administramos nada"]

    subgraph WIT["5 · TESTIGOS — gossip en segundos"]
        direction LR
        W1["Seguridad interna"]
        W2["Compliance / auditor"]
        W3["Federación de orgs (prod)"]
    end

    S2 -->|"cabezas por gossip"| WIT

    subgraph VERIF["6 · VERIFICADOR"]
        VF["recomputa hashes · detecta huecos de seq<br/>compara raíz local vs anclada vs testigos"]
    end

    DB --> VF
    WIT --> VF
    AN --> VF

    subgraph HUM["7 · HUMANOS — tres gestos"]
        direction LR
        V1["VER<br/>dashboard del enjambre"]
        V2["RESPONDER<br/>alerta Telegram · forense · kill switch"]
        V3["COMPROBAR<br/>página pública de verificación"]
    end

    DB --> V1
    VF --> V2
    AN --> V3
```

### Lectura del diagrama, capa por capa

1. **Enjambre de agentes**: los agentes trabajan en paralelo (y el dogfooding de la hackathon: se monitorean a sí mismos durante el evento).
2. **Captura en plataforma**: la telemetría **nunca la auto-reporta el agente**. Se captura fuera de su control — como la caja negra del avión, que no la escribe el piloto. Un agente comprometido puede intentar cosas, pero no puede escribir su propio diario.
3. **Zona de sellado**: hash-chain por sesión (`seq` + `prev_hash`), agregación Merkle periódica, firma post-cuántica de la raíz. Llaves aisladas: los agentes jamás tienen acceso a la llave de anclaje.
4. **Evidencia off-chain**: Postgres (eventos core) + CAS con WORM (blobs). La integridad no depende de la fe en el storage — depende de los hashes.
5. **Testigos**: réplicas independientes de las cabezas de cadena vía gossip — divergencia de un escritor comprometido detectable en segundos.
6. **Verificador**: recomputa, compara contra raíz anclada y testigos, detecta alteración (mismatch) y borrado (hueco de secuencia).
7. **Humanos**: los tres gestos.

---

## 4. Protocolo anti-manipulación

**Pregunta que resuelve:** *"¿Qué pasa si un agente modifica la evidencia?"* — El ataque esperado, y el corazón de la demo.

```mermaid
sequenceDiagram
    autonumber
    participant R as Agente ROGUE
    participant E as Evidence Store
    participant S as Sealer
    participant V as Verificador
    participant B as Beto (seguridad)
    participant C as Cadena pública

    R->>R: se desvía (drift → intento de exfiltración)
    R->>E: intenta BORRAR / editar sus rastros
    V->>V: recomputa hashes vs raíz anclada
    Note over V: hash mismatch = alteración<br/>hueco de seq = borrado detectable<br/>aunque el contenido ya no exista
    V->>S: sella el evento de detección
    S->>C: ancla el reporte de detección
    Note over C: el forense del forense también es inmutable
    V->>B: alerta Telegram — evidencia manipulada
    B->>R: KILL SWITCH / quarantine
    B->>E: snapshot forense (preservar antes de más daño)
    S->>S: reconstrucción vs raíces + testigos
    S->>C: reporte final firmado y anclado
    Note over B,C: qué se alteró · cuándo · desde dónde · mapa de huecos
```

**Los 7 pasos:** detectar → sellar la detección → alertar → contener (kill switch) → preservar (snapshot) → reconstruir → anclar el reporte.

**Principios clave:**

- **Integridad garantizada, disponibilidad best-effort**: el sistema prueba qué fue manipulado incluso si no puede recuperar el contenido borrado — y en forense, "estos registros fueron alterados a las 14:32 desde la sesión X" suele ser, por sí solo, la evidencia.
- **Sellado recursivo**: la evidencia sobre la evidencia es inmutable.

---

## 5. Verificación por cualquier tercero — el acto de Trust

**Pregunta que resuelve:** *"¿Cómo lo usa alguien de afuera sin confiar en la empresa?"*

```mermaid
sequenceDiagram
    autonumber
    participant J as Auditor / Cliente / Ciudadano
    participant P as Página pública de verificación
    participant C as Cadena pública (Ethereum / L2)

    J->>P: pega el ID del reporte
    P->>P: recupera log + camino Merkle (O(log n))
    P->>C: lee la raíz anclada — sin pedir permiso a nadie
    C-->>P: raíz en bloque finalizado
    P-->>J: VERIFICADO — anclado en bloque X — fecha Y
```

Nadie tiene que confiar en la empresa para verificar sus evidencias. La entidad no dice "confía en mí" — dice **"compruébalo tú mismo"**.

---

## 6. Decisiones de diseño — cada pregunta resuelta

| # | Pregunta | Decisión | Fundamento |
|---|---|---|---|
| 1 | ¿Qué se registra? | Triaje: **core** (full), **contexto** (hash+blob), **ruido** (agregados) | No toda la telemetría es evidencia; sellar 10.000 heartbeats no escala ni aporta |
| 2 | ¿Dónde viven los originales? | Off-chain: Postgres + CAS con WORM + testigos | La cadena prueba *qué debe existir*; los testigos proveen *que sigue existiendo*. Perder blobs no pierde la prueba (el hueco de seq es evidencia) |
| 3 | ¿Blockchain pública o privada? | **Pública** — alquilar el consenso | Una cadena que administro es una cadena que el atacante reescribe. On-prem = DB con ropa de blockchain. La confianza vive afuera |
| 4 | ¿Cómo evitamos el crecimiento de la cadena? | Solo raíces Merkle (32B) on-chain | **La cadena crece con el reloj, no con las acciones**: 10 eventos o 10 millones → una raíz |
| 5 | ¿Y si el agente manipula la cadena? | No puede | Reescribir Ethereum = ataque del 51% global. Ese es exactamente el punto de anclar afuera |
| 6 | ¿Y si manipula el store local? | Protocolo de 7 pasos (sección 4) | El borrado deja huecos firmados; la alteración deja hashes rotos; el reporte se ancla |
| 7 | Agente centralizado vs consenso de red | Alquilar consenso + 4 capas de veracidad (abajo) | La cadena garantiza **inmutabilidad, no veracidad** — un rogue podría anclar raíces falsas; las capas lo impiden |
| 8 | ¿Acciones por segundo? | Hash-chains **por sesión** (paralelas, sin contención) + agregación periódica | Sellado escalable horizontal; el trabajo global es solo agregar cabezas |
| 9 | ¿Cómo lo usan las personas? | VER / RESPONDER / COMPROBAR | Caja negra: cero fricción diaria es un feature, no un bug |
| 10 | ¿Criptografía nueva? | No — composición nueva | Cripto estándar de 20 años (CT/KSI) aplicada a la era de agentes. Lo que codificamos: sealer, batcher, anchor, verifier, contrato registry |

### Las 4 capas de veracidad (respuesta a "el agente es centralizado")

La cadena da inmutabilidad; la **veracidad** del contenido se garantiza por capas:

1. **El que registra no es el registrado** — captura en plataforma (harness/gateway), no auto-reporte del agente.
2. **Llaves aisladas + keys pineadas** — solo la trust zone sella; un anclaje de key desconocida se rechaza de entrada.
3. **Pre-compromiso** — el anclaje a intervalo fijo clava el pasado: no se puede fabricar historia retroactiva, solo hacia adelante, y se detecta al primer bloque de divergencia.
4. **Testigos múltiples** — gossip de cabezas en segundos; un escritor comprometido diverge de la mayoría.

> Cada mentira requiere engañar simultáneamente a Ethereum **y** a todos los testigos.

---

## 7. Qué se registra — triaje y schema

| Nivel | Qué | Cómo se sella |
|---|---|---|
| **Core** (siempre, full) | tool calls + args, comandos, accesos/credenciales, decisiones, errores, auth | Hash-chain + blob completo |
| **Contexto** (siempre, hash+blob) | prompts, outputs de tools, contenido RAG, razonamiento | hash en la cadena + blob en CAS |
| **Ruido** (agregados) | heartbeats, retries, métricas | Contadores/histogramas por hora — el resumen se sella |

Schema mínimo del evento core:

```json
{
  "seq": 4821,
  "ts": "2026-10-24T14:32:01Z",
  "agent_id": "agent-07",
  "session_id": "ses-...",
  "type": "tool_call",
  "tool": "shell.exec",
  "args_digest": "sha256:9f2c...",
  "args_blob": "cas://9f2c...",
  "result_digest": "sha256:ab31...",
  "prev_hash": "sha256:77bd...",
  "actor": "sealer@trust-zone-1"
}
```

`seq` + `prev_hash` son el dúo que detecta alteración (hash roto) y borrado (hueco de secuencia).

---

## 8. Escala — las tres curvas de crecimiento

| Crecimiento | Tamaño | Dónde vive | Coste |
|---|---|---|---|
| **Eventos** | ~0.5KB c/u | Off-chain: DB | Lineal, barato — problema resuelto hace 20 años |
| **Blobs** | MB/día | Off-chain: CAS + WORM, ciclo hot→warm→cold | Storage commodity + dedup |
| **Raíces on-chain** | **32B por intervalo** | La cadena | **Constante por tiempo, cero por evento** |

**La matemática (escenario absurdo a propósito):** 1.000 agentes · 100 eventos/seg · 8.6M eventos/día → off-chain ~4GB/día · on-chain **288 anclajes/día ≈ 10KB/día** — igual con 10 ev/s o con 100.000. Verificación **O(log n)**: ~700B por prueba de inclusión.

Ciclo de vida del storage: **HOT** (0-90 días, forense rápida) → **WARM** (90 días-2 años) → **PÉRMANENTE** (WORM / Arweave como roadmap). La mantenibilidad no está en conservar todo en un lugar — está en que **la verdad es indestructible aunque los discos no lo sean**.

---

## 9. Cadencias y costos

| Operación | Cadencia | Costo / tamaño |
|---|---|---|
| Sellado de evento | por acción | ~0.5KB off-chain |
| Gossip a testigos | segundos | cabezas de sesión |
| Anclaje en L2 (Base) | cada 5 min | centavos |
| Checkpoint en mainnet | diario | ~$1-5 |
| Finalidad del anclaje | ~13 min | UI: "anclado" → "finalizado" |

Riesgos gestionados: reorgs (finalidad tras N confirmaciones) · fugas de metadatos (raíces opacas + anclaje a intervalo fijo) · disponibilidad (heartbeat de anclaje = alarma si se detiene) · GDPR (hash-only on-chain; blobs borrables respetan el derecho al olvido efectivo).

---

## 10. Deployment en 3 niveles

| Nivel | Arquitectura | Historia |
|---|---|---|
| **Demo (36h)** | Sepolia + 1-2 anclajes en mainnet como acto final | "Esta raíz es verificable en Ethereum mainnet para siempre" |
| **Pilot** | Anclaje en L2 cada 5 min | "Presupuesto de café" |
| **Enterprise** | Federación permissioned de orgs (testigos mutuos) + checkpoint público periódico | Ni un cospiración de todos los nodos internos puede falsear — choca contra el anclaje externo |

---

## 11. Componentes a construir + librerías (36h)

| Pieza | Librería / tecnología |
|---|---|
| Sealer middleware (hash-chain + CAS) | `crypto` (sha256) — ~150 líneas propias |
| Merkle batcher | `@openzeppelin/merkle-tree` |
| Firma post-cuántica (ML-DSA) | OpenSSL 3.5 / liboqs |
| Anchor job | `viem` / `ethers` + RPC de Sepolia |
| Registry contract | ~20 líneas de Solidity (raíces + timestamps + eventos) |
| Captura | OpenTelemetry collector / middleware del harness |
| Verificador + forense UI | propio — el corazón del demo |
| Dashboard + Consola del Caos | web app |
| Alertas | bot de Telegram |

---

## 12. Los 4 momentos de la demo (Consola del Caos)

1. **El enjambre** — agentes trabajando en paralelo (la tarea real de la hackathon), todo sellado y anclado en vivo.
2. **El rogue** — un agente se desvía (drift → intento de exfiltración), detectado en vivo.
3. **El golpe final** ⭐ — el rogue intenta **borrar sus huellas**: el verificador detecta hash roto + hueco de secuencia, recupera evidencia de testigos, forense en pantalla (qué se borró, cuándo, desde dónde).
4. **"Cualquiera puede verificar"** — el juez mismo verifica un reporte contra el anclaje público, sin acceso a nada nuestro. El acto de Trust en vivo.

---

## 13. Mapeo contra la rúbrica

| Criterio | Peso | Cómo lo cubre |
|---|---|---|
| Aspecto técnico | 25% | PQ real (ML-DSA), Merkle/hash-chains, contrato en testnet, integración OTel, forense |
| Ambición | 20% | "La cadena de custodia para la era de agentes" — Certificate Transparency/KSI para un problema de 3 meses de vida |
| Ejecución | 20% | 100% software, factible en 36h, demo end-to-end dramática |
| Impacto | 20% | Incidente HF hace 3 meses · 90% de agentes sin monitoreo · EU AI Act exigiendo auditoría |
| Originalidad | 15% | No "blockchain por blockchain": CT aplicado a agentes + detección de borrado + PQ para evidencia de largo plazo |

---

## 14. Pendientes / próximos pasos

- [ ] Validar esta guía con el mentor (las dos objeciones ya están resueltas: secciones 4, 6 y 8)
- [ ] Guion de demo segundo a segundo
- [ ] Plan de las 36 horas con frentes del equipo
- [ ] Estructura del pitch final + Q&A anticipado
- [ ] Decidir: testnet(s) concreta y cadencia de anclaje final del demo
