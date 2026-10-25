#!/bin/sh
# Uso: sh scripts/chain/forge.sh build | test ...
# Foundry en un contenedor Podman; forge-std se instala una vez en contracts/lib (ignorado por git).
set -e
export MSYS_NO_PATHCONV=1
IMAGE=constancia-foundry
podman image inspect "$IMAGE" >/dev/null 2>&1 || podman build -t "$IMAGE" -f scripts/chain/Dockerfile scripts/chain
run() { podman run --rm -v "$(pwd -W 2>/dev/null || pwd):/work" -w /work/contracts "$IMAGE" "$@"; }
[ -d contracts/lib/forge-std ] || run install --no-git foundry-rs/forge-std
run "$@"
