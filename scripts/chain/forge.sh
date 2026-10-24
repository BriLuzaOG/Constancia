#!/bin/sh
# Uso: sh scripts/chain/forge.sh build | test | install ...
# Construye la imagen una vez y ejecuta forge sobre el repo montado.
set -e
export MSYS_NO_PATHCONV=1
IMAGE=constancia-foundry
podman image inspect "$IMAGE" >/dev/null 2>&1 || podman build -t "$IMAGE" -f scripts/chain/Dockerfile scripts/chain
podman run --rm -v "$(pwd -W 2>/dev/null || pwd):/work" -w /work/contracts "$IMAGE" "$@"
