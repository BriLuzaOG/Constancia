# Foundry sin instalación local: forge, cast y anvil en un contenedor
FROM ghcr.io/foundry-rs/foundry:stable

# git es necesario para `forge install` (dependencias de contratos)
USER root
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /work
ENTRYPOINT ["forge"]
