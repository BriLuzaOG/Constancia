#!/bin/sh
# Publishes this container's PID namespace so the collector can find the agent.
set -eu
readlink /proc/self/ns/pid > /run/trust/agent.pidns
exec claude "$@"
