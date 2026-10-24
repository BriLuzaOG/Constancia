#!/usr/bin/env bash
# Finds the agent container from the host PID namespace and runs one capture:
#   actions -> bpftrace probes 1 2 3 5 into /out/capture.jsonl
#   tls     -> ecapture TLS plaintext 4 7 into /out/tls.log
set -euo pipefail

mode=${1:?usage: collector-entrypoint actions|tls}
out_uid=${OUT_UID:-0}

# Sets agent_pid (host PID of the harness) and agent_pidns (namespace inode).
# The node process renames itself to "claude", so match on comm, not cmdline.
wait_for_agent() {
    while true; do
        if [[ -s /run/trust/agent.pidns ]]; then
            local target proc
            target=$(cat /run/trust/agent.pidns)
            for proc in /proc/[0-9]*; do
                if [[ $(readlink "$proc/ns/pid" 2>/dev/null) == "$target" ]] &&
                    [[ $(cat "$proc/comm" 2>/dev/null) == claude ]]; then
                    agent_pid=${proc#/proc/}
                    agent_pidns=${target//[^0-9]/}
                    return
                fi
            done
        fi
        echo "waiting for the agent container..." >&2
        sleep 1
    done
}

wait_for_agent
echo "agent found: host pid $agent_pid, pid namespace $agent_pidns" >&2
umask 077

case $mode in
    actions)
        out=/out/capture.jsonl
        install -m 600 -o "$out_uid" /dev/null "$out"
        script=$(mktemp --suffix=.bt)
        sed "s|__TARGET__|curtask->nsproxy->pid_ns_for_children->ns.inum == $agent_pidns|" \
            /opt/trust/actions.bt > "$script"
        # 4 KB OUT events overflow the default 64-page buffer during bursts (lost_events).
        BPFTRACE_MAX_STRLEN=4096 BPFTRACE_PERF_RB_PAGES=1024 \
            bpftrace -B line -f json "$script" "$agent_pid" | tee "$out"
        ;;
    tls)
        out=/out/tls.log
        install -m 600 -o "$out_uid" /dev/null "$out"
        # The agent's libssl lives in its own image; reach it through its root.
        ecapture tls -m text --libssl="/proc/$agent_pid/root/usr/lib64/libssl.so.3" 2>&1 | tee "$out"
        ;;
    *)
        echo "unknown mode: $mode" >&2
        exit 2
        ;;
esac
