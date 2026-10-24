# Constancia

Work letters that prove themselves and show only what the holder chooses.

<img src="./project-logo.png" alt="Constancia logo" width="200" />

**Deploy:** `<FILL THIS: Render URL>`

## 🧭 What it is

Employment letters are faked in minutes and trusted anyway. Constancia turns them into credentials
that prove themselves: employers issue, the holder shares one fact at a time, and anyone can check
it in seconds, with nothing to install.

## 🔄 How it works

1. **Employer** (`/employer`): HR signs in with a key on their device, applies to the consortium and,
   once a quorum of members approves, issues certificates.
2. **Holder** (`/vault`, `/cv`): asks for a certificate, receives it encrypted, shares claim by
   claim by link or QR, and joins many certificates into a Verified CV.
3. **Verifier** (`/verify`): five checks run in the browser; only the chosen claims appear.
   `/verify/lab` tries four forgeries, and `/ledger` shows the consortium network.

## 🏗️ Architecture

- **Credential:** W3C VC 2.0 secured with SD-JWT (selective disclosure), ES256 device keys.
- **Ledger:** public Sepolia, a consortium contract with members and quorum; stores hashes only.
- **Accounts:** ERC-4337 accounts controlled by P-256 device keys; a consortium sponsor wallet pays all gas.
- **Server:** a blind mailbox (ciphertext, public keys, opaque employee number) on Postgres.
- **Verifier:** all five checks run in the browser.

## 🚀 Run locally

```bash
pnpm install
cp .env.example .env.local   # fill the values
pnpm dev                     # http://localhost:3000
```

By default the app uses the in-memory ledger (`LEDGER_MODE=memory`, development and tests only).
For the real ledger, set `LEDGER_RPC_URL` (Sepolia), `LEDGER_MODE=chain` and
`NEXT_PUBLIC_LEDGER_MODE=chain`, and run `pnpm chain:status` to check the connection.

Before pushing: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## ⚠️ Honest limits

- Selective disclosure, not zero-knowledge proofs.
- The ledger proves who said it and when, not that it is true.
- A shared link can be replayed until it expires.
- In the demo the ledger runs on public Sepolia and one sponsor wallet pays all gas.
- All employers, members and people shown are fictional.

## 📚 Docs

[Product](PRODUCT.md) · [Design](DESIGN.md) · [Plan](docs/plan/README.md) ·
[Contracts](docs/plan/contracts.md) · [Demo script](docs/plan/demo.md) ·
[Human guide](docs/plan/human-guide.md)

## 👥 Team

team-24, Platanus Hack 26 Caracas.

- Diego Enrique Garcia Gonzalez ([@devgago](https://github.com/devgago))
- Luis Ochoa ([@tipotramquilo](https://github.com/tipotramquilo))
- Franklin Quintana ([@franku03](https://github.com/franku03))
- Gustavo Enrique Kufatty Anton ([@kufatty](https://github.com/kufatty))
- Jose Briceno ([@briluzaog](https://github.com/briluzaog))

## ☁️ Deploying to Render

Render can only connect to repositories you own, so mirror this repo to a personal one:

```bash
git remote set-url --add --push origin https://github.com/platanus-hack/platanus-hack-26-ve-team-24.git
git remote set-url --add --push origin https://github.com/<your-user>/<your-repo>.git
```

From then on `git push` updates both. Connect Render to the personal repo and import `render.yaml`
once (Dashboard → Blueprints → New Blueprint Instance).

`.github/workflows/cd.yml` runs on every push to `main`: lint, typecheck and build must pass, then
it triggers a Render deploy of that exact commit and waits until it is live. Repository secrets
(Settings → Secrets and variables → Actions):

| Secret | Required | Where to get it |
| --- | --- | --- |
| `RENDER_DEPLOY_HOOK_URL` | yes | Service → Settings → Deploy Hook |
| `RENDER_API_KEY` | to verify | Account Settings → API Keys |
| `RENDER_SERVICE_ID` | to verify | `srv-…` in the service URL |

Optional repository variable `RENDER_SERVICE_URL` is printed once the deploy is live. Without the
hook secret the deploy job skips with a warning; without the other two it deploys but does not
verify.
