// Browser wiring for the issuing orchestration: the real signer, ledger client, encryption and mailbox.
import { encryptForHolder } from '../credential/share-crypto';
import { issueCredential } from '../credential/sdjwt';
import type { Es256Signer } from '../credential/keys';
import type { Address } from '../credential/types';
import { clientEnv } from '../env';
import { createAccountClient } from '../ledger/account-client';
import { appendIssued } from './issued-log';
import type { IssueDeps } from './issue';
import { deliverRequest } from './requests-client';

export function browserIssueDeps(args: {
  account: Address;
  signer: Es256Signer;
  discard: () => void;
}): IssueDeps {
  const { account, signer, discard } = args;
  const { NEXT_PUBLIC_APP_URL: appUrl, NEXT_PUBLIC_LEDGER_CHAIN_ID: chainId } = clientEnv();
  return {
    sign: (record, holderJwk) =>
      issueCredential({
        record,
        issuer: { did: `did:constancia:${chainId}:${account}`, keyId: signer.keyId },
        signer,
        holderJwk,
        appUrl,
      }),
    anchor: async (hash) => (await createAccountClient({ signer, account })).anchor(hash),
    encrypt: encryptForHolder,
    deliver: deliverRequest,
    record: appendIssued,
    discard,
  };
}
