# Constancia

Constancias de trabajo que se prueban solas y muestran solo lo que el trabajador elige.

## El problema

Una constancia de trabajo es un PDF que cualquiera falsifica en minutos, y bancos, arrendadores y consulados igual tienen que confiar en él. Quien la presenta, además, entrega todo el documento aunque solo se le pida un dato.

## Cómo funciona

1. **Empleador.** RR. HH. crea una cuenta de organización con una clave del dispositivo (sin wallet, sin comisiones) y solicita acreditación al consorcio. Cuando un quórum de miembros la aprueba, puede emitir.
2. **Trabajador.** Pide una constancia a su empleador. La recibe cifrada de extremo a extremo, con una clave propia por solicitud, y la guarda en su bóveda. Comparte **un dato a la vez** (empleado desde…, banda de ingreso, cargo) por enlace o QR, viendo antes exactamente lo que verá el lector.
3. **Verificador.** Abre el enlace. Cinco chequeos corren en su navegador: certificado, empleador acreditado, firma, vínculo con su titular y registro en el ledger. Solo aparecen los datos elegidos, con el número exacto de los que siguen ocultos.

Varias constancias se unen en un **CV verificado**: la clave de cada constancia firma el hash del conjunto, así que nadie puede agregar un empleo ajeno ni quitar uno después de sellarlo. El **Laboratorio de cartas falsas** permite probar cuatro falsificaciones y ver en qué chequeo falla cada una.

## El ledger del consorcio

La raíz de confianza no es una empresa ni una cadena pública, sino la acreditación por un consorcio de miembros (en la demo: ficticios). Es una red permisionada con cuatro validadores y bloques de 2 s, sin comisiones, y su estado es público en `/ledger`. Guarda solo hashes, la cuenta del emisor y la hora: ningún nombre, dato ni certificado.

## Qué es real en la demo y qué no

- Las constancias son credenciales SD-JWT con divulgación selectiva (no pruebas de conocimiento cero); la verificación ocurre en el navegador.
- El servidor solo ve texto cifrado, claves públicas, hashes y un número de empleado opaco.
- Todos los empleadores, miembros y personas son ficticios.
- En la demo los cuatro validadores corren en un mismo equipo y el navegador confía en una sola pasarela de lectura.
- El ledger prueba quién lo dijo y cuándo, no que sea cierto: un empleador acreditado puede mentir, y la suspensión es la consecuencia.
- Un enlace compartido se puede reutilizar hasta que expire. Si se pierde el dispositivo, se pide de nuevo la constancia.

## Tecnología

Next.js 16, React 19, Tailwind CSS 4, TypeScript, SD-JWT VC (W3C VC 2.0), claves ES256 de WebCrypto, Hyperledger Besu (QBFT), Solidity y Foundry, cuentas ERC-4337 con claves P-256, viem, PostgreSQL con Prisma (solo buzón cifrado).

## Equipo

team-24 · Platanus Hack 26 Caracas.
