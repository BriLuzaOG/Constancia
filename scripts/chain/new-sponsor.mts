import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

// Imprime una llave nueva: pégala en RELAYER_PRIVATE_KEY (.env.local o Render). Nunca en git.
const key = generatePrivateKey();
console.log(`RELAYER_PRIVATE_KEY=${key}`);
console.log(`Sponsor address: ${privateKeyToAccount(key).address}`);
