# Host de captura: requisitos e instalación

Qué instalar en el host Linux para que el kernel capture la actividad del agente: syscalls ①②③⑤ con bpftrace y TLS en claro ④⑦ con ecapture. Probado en Fedora 44 (kernel 7.2, x86_64).

## Requisitos

| Requisito | Versión probada | Por qué |
|---|---|---|
| Kernel con BTF | `/sys/kernel/btf/vmlinux` presente | bpftrace lee `struct sock` para `ip:puerto` |
| Node de la distro | `nodejs22` (22.23.1) | Linkea `libssl.so.3` **dinámica**; ecapture solo hookea esa |
| Claude Code JS | `@anthropic-ai/claude-code@2.1.112` | La última versión en JS. Desde la 2.1.113 es binario nativo y el TLS no se puede hookear |
| bpftrace | v0.24.2 | Probes ①②③⑤ (`scripts/actions.bt`) |
| ecapture | v2.8.2 | Probes ④⑦ (TLS en claro) |
| jq | cualquiera | Decodificar las capturas |
| sudo | — | eBPF necesita root |

> **No uses** fnm, nvm, el binario oficial de nodejs.org ni el `claude` nativo (`~/.local/bin/claude`). Todos traen OpenSSL estático o embebido, y ecapture no ve nada.

## Instalación

### 1. Node de la distro + bpftrace + jq

```bash
sudo dnf install -y nodejs bpftrace jq
ldd /usr/bin/node | grep libssl
# esperado: libssl.so.3 => /lib64/libssl.so.3
```

Si `which node` no da `/usr/bin/node`, otro gestor (fnm, nvm) está delante en el `PATH`. Quítalo o llama siempre a `/usr/bin/node`.

### 2. Claude Code en JS (sin sudo)

```bash
/usr/bin/npm install --prefix ~/.local/claude-js @anthropic-ai/claude-code@2.1.112
/usr/bin/node ~/.local/claude-js/node_modules/@anthropic-ai/claude-code/cli.js --version
# esperado: 2.1.112 (Claude Code)
```

### 3. ecapture

El nombre del archivo lleva la versión. `latest/download/...` no funciona.

```bash
curl -L -o /tmp/ecapture.tar.gz \
  https://github.com/gojue/ecapture/releases/download/v2.8.2/ecapture-v2.8.2-linux-amd64.tar.gz
mkdir -p /tmp/ecapture-extract && tar -xzf /tmp/ecapture.tar.gz -C /tmp/ecapture-extract
sudo install -m 755 /tmp/ecapture-extract/ecapture-v2.8.2-linux-amd64/ecapture /usr/local/bin/ecapture
ecapture --version
```

## Correr una captura

Lanza todo desde la raíz del repo. Cada comando va en su propia terminal.

**Terminal 1. El agente dentro de la slice:**

```bash
sudo systemctl reset-failed claude-demo 2>/dev/null
sudo systemd-run --slice=trust-agent.slice --unit=claude-demo --pty --same-dir \
     --setenv=PATH="$PATH" --setenv=DISABLE_AUTOUPDATER=1 \
     --uid=$(id -u) --gid=$(id -g) \
     /usr/bin/node ~/.local/claude-js/node_modules/@anthropic-ai/claude-code/cli.js
```

**Terminal 2. Syscalls ①②③⑤:**

```bash
sudo scripts/collect.sh            # escribe en /var/tmp/trust-agent/capture.jsonl
```

**Terminal 3. TLS ④⑦:**

```bash
sudo ecapture tls -m text --libssl=/lib64/libssl.so.3 2>&1 | sudo tee /var/tmp/trust-agent/tls.log
```

**Ver la salida decodificada de `OUT`:**

```bash
jq -r 'select(.type=="printf") | .data' /var/tmp/trust-agent/capture.jsonl \
  | grep '^OUT' | cut -f7- \
  | while IFS= read -r line; do printf '%b' "$line"; done
```

## Trampas conocidas

| Síntoma | Causa | Arreglo |
|---|---|---|
| `Failed to get cgroupid ... trust-agent.slice` | systemd anida las slices por guion: la ruta real es `/trust.slice/trust-agent.slice/` | Ya está así en `actions.bt` |
| `Unit claude-demo.service was already loaded` | Queda la unit de una prueba anterior | `sudo systemctl reset-failed claude-demo` |
| `tee: /tmp/...: Permission denied` como root | `fs.protected_regular` impide que root reabra un archivo de otro usuario en `/tmp` | `collect.sh` escribe en `/var/tmp/trust-agent/` |
| El agente lista `/` en vez del repo | `systemd-run` arranca en la raíz | `--same-dir` |
| Hooks con `command not found` (exit 127) | systemd usa un `PATH` mínimo | `--setenv=PATH="$PATH"` |
| `npm error EACCES ... /usr/local/lib/node_modules` | El actualizador de Claude Code intenta subir a una versión nativa | `--setenv=DISABLE_AUTOUPDATER=1` |
| La respuesta TLS se ve como basura | Es el body HTTP comprimido (`Content-Encoding: gzip`/`br`), no cifrado | Descomprimir después de capturar |

## Seguridad

Las capturas tienen **secretos en claro**: el `Authorization: Bearer sk-ant-...` del agente, prompts y salidas de comandos.

- No las subas a git ni las pegues en chats.
- Antes de mostrarlas, censúralas:

  ```bash
  sed -E 's/sk-ant-[A-Za-z0-9_-]+/sk-ant-REDACTED/g; s/Bearer [A-Za-z0-9._-]+/Bearer REDACTED/g' \
    /var/tmp/trust-agent/tls.log > /var/tmp/trust-agent/tls.redacted.log
  ```

- Si un token se filtra, revócalo cerrando sesión en Claude Code (`/logout`).

## Límites actuales del collector

- `NET` solo ve TCP (`kprobe:tcp_connect`). La exfiltración por UDP/DNS no aparece.
- Un proceso matado con señal (`kill -9`) no pasa por `exit_group`, así que no genera `EXIT`.
- `%r` no escapa `\`: un `\x41` literal en la salida no se distingue de un byte real. Para evidencia forense hay que pasar a `%rx`.
- El filtro está fijo a la unit `claude-demo`. Para pi.dev hay que cambiar la ruta del cgroup en `actions.bt`.
