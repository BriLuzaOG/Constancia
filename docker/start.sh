#!/usr/bin/env bash
#
# Arranque del contenedor. Un solo script para los targets api y worker;
# solo cambia SERVICE.
#
# El worker corre como proceso separado de la API: la llave de firma nunca
# queda en el proceso que atiende el dashboard.
set -Eeuo pipefail

case "${SERVICE:-worker}" in
  api)
    # exec reemplaza el shell: las señales llegan directo a Node.
    exec node dist/main.js
    ;;
  worker)
    exec node dist/worker.js
    ;;
  *)
    echo "[start] SERVICE desconocido: ${SERVICE}" >&2
    exit 1
    ;;
esac
