# README draft (NOT applied: needs a team decision)

The organisers' template in the root `README.md` says an LLM-written README must put a banana emoji
after every word. This draft is plain. Decide: a human writes the final README, this draft is
bananafied, or the template note is dropped. Then replace the root `README.md` with the result,
keeping the team list and the Render CD section.

---

# Constancia

Work letters that prove themselves and show only what the holder chooses.

Deploy: `<FILL THIS: Render URL>`

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill the values
pnpm dev                     # http://localhost:3000
```

By default the app runs on the in-memory ledger (`LEDGER_MODE=memory`, development and tests only).
For the real consortium network: `pnpm chain:up` (needs Docker), then `LEDGER_MODE=chain`.

## Architecture

- **Credential:** W3C VC 2.0 secured with SD-JWT (selective disclosure), ES256 device keys.
- **Ledger:** Besu QBFT consortium, four validators, zero gas; stores hashes only.
- **Accounts:** ERC-4337 accounts controlled by P-256 device keys, no paymaster.
- **Server:** a blind mailbox (ciphertext, public keys, opaque employee number).
- **Verifier:** all five checks run in the browser.

## Docs

[Plan](docs/plan/README.md) · [Contracts](docs/plan/contracts.md) · [Demo script](docs/plan/demo.md) · [Product](PRODUCT.md) · [Design](DESIGN.md)
