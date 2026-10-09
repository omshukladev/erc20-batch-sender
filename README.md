# TSender

A non-custodial dApp for sending an ERC20 token to a whole list of wallets in a single transaction.

Instead of firing off one transfer per recipient, TSender checks your allowance, approves its contract when needed, and calls `airdropERC20` once — everyone gets paid in the same transaction. The app never takes custody: your keys stay in your wallet and you sign every transaction.

---

## Features

- **Batch transfers** — any number of recipients in one transaction
- **Just-in-time approvals** — reads `allowance` first and only approves when it is too low
- **Token details panel** — reads `name` / `symbol` / `decimals` from the token contract and shows the amount in both raw units and human-readable form
- **Step-aware progress UI** — check wallet → approving → sending → complete, with a status card
- **Readable errors** — wallet rejections become "Transaction cancelled in your wallet" instead of a stack trace
- **Inputs persist** across refreshes (localStorage)
- **Light / dark theme**, mobile-first responsive layout
- **Wallet-agnostic** — MetaMask, Rainbow, WalletConnect and more via RainbowKit

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Web3 | wagmi, viem, RainbowKit |
| Data fetching | TanStack Query |
| Local chain | Foundry (Anvil) |
| Tests | Vitest + jsdom |

## How it works

1. `allowance(owner, tsender)` is read from the token contract
2. If the allowance is below the total, the app sends `approve(tsender, total)` and waits for the receipt
3. It calls `airdropERC20(tokenAddress, recipients[], amounts[], totalAmount)` on the TSender contract for the connected chain
4. The contract pulls the tokens once and distributes them to every recipient

Each airdrop **spends** the allowance, which is why the next send asks you to approve again.

## Getting started

### Prerequisites

- Node.js 20+ (developed on Node 24)
- A free WalletConnect Cloud project ID
- MetaMask or any injected wallet
- Foundry — only needed for the local chain

### Install

```bash
git clone https://github.com/omshukladev/erc20-batch-sender
cd ts-sender
npm install
```

### Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

The app throws at startup if this is missing. On a host such as Vercel, set it in the project's environment variables instead.

### Run

```bash
npm run dev     # http://localhost:3000
```

## Local development on Anvil

The repository ships `tsender-deployed.json` — an Anvil state snapshot with the TSender contract and a mock ERC20 already deployed, so no deployment scripts are required.

```bash
npm run anvil   # anvil --load-state tsender-deployed.json
```

| What | Value |
| --- | --- |
| Network | Anvil — chain ID `31337`, RPC `http://127.0.0.1:8545` |
| Token | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` — "Mock Token" (18 decimals, 100 MT pre-minted to account 0) |
| TSender | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Recipients | any Anvil account 1–9 — they start at 0 MT, so you can watch the balance land |

Import Anvil accounts into MetaMask using the private keys Anvil prints on startup. Every restart resets the chain to the snapshot block.

Sanity checks:

```bash
cast block-number --rpc-url http://127.0.0.1:8545
cast code 0x5FbDB2315678afecb367f032d93F642f64180aa3 --rpc-url http://127.0.0.1:8545
```

## Testing on a testnet (Sepolia)

1. Get free Sepolia ETH for gas from any Sepolia faucet
2. Get a test token: USDC from `faucet.circle.com`, LINK from `faucets.chain.link`, or deploy your own ERC20 in Remix
3. Connect that account on Sepolia, paste the token address, add recipients and amounts, then hit **Send Token**

Addresses the app uses on Sepolia:

| Contract | Address | Decimals |
| --- | --- | --- |
| USDC (test) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 6 |
| LINK (test) | `0x779877A7B0D9E8603169DdbD7836e478b4624789` | 18 |
| TSender | `0xa27c5C77DA713f410F9b15d4B0c52CAe597a973a` | — |

## Amounts and decimals

Amounts are entered in **raw token units**, not decimal amounts:

| Token decimals | Value for "1 token" |
| --- | --- |
| 18 (most tokens) | `1000000000000000000` |
| 6 (USDC, USDC.e) | `1000000` |

The Transaction Details panel shows both figures so you can confirm before sending. Recipient count must equal amount count, and the total must equal their sum — otherwise the contract rejects the airdrop.

## Supported networks

| Network | Chain ID | TSender |
| --- | --- | --- |
| Ethereum | 1 | `0x3aD9F29AB266E4828450B33df7a9B9D7355Cd821` |
| Base | 8453 | `0x31801c3e09708549c1b2c9E1CFbF001399a1B9fa` |
| Arbitrum One | 42161 | `0xA2b5aEDF7EEF6469AB9cBD99DE24a6881702Eb19` |
| OP Mainnet | 10 | `0xAaf523DF9455cC7B6ca5637D01624BC00a5e9fAa` |
| zkSync Era | 324 | `0x7e645Ea4386deb2E9e510D805461aA12db83fb5E` |
| Sepolia | 11155111 | `0xa27c5C77DA713f410F9b15d4B0c52CAe597a973a` |
| Anvil (local) | 31337 | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |

On any other chain the app tells you the network is unsupported instead of guessing at an address.

## Project structure

```
src/
├─ app/
│  ├─ layout.tsx          root layout, fonts, theme bootstrap
│  ├─ providers.tsx       RainbowKit + wagmi + React Query
│  ├─ page.tsx            landing page (hero, form, docs sections)
│  └─ globals.css         Tailwind v4 theme + dark variant
├─ components/
│  ├─ Header.tsx          sticky header, theme toggle, wallet button
│  ├─ AirdropForm.tsx     the whole send flow
│  └─ ui/InputField.tsx   labelled input / textarea
├─ utils/calculateTotal/  sums the amount list
├─ constants.ts           chain → TSender addresses, erc20 + tsender ABIs
└─ rainbowKitConfig.tsx   wagmi/RainbowKit configuration
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run anvil` | Start a local chain with the contracts pre-deployed |

## Deployment

Any Next.js host works — Vercel is the simplest. The only requirement is the `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` environment variable. There is no backend or database: all state lives on-chain, and the app is a wallet-connected front end.

For a public deployment, drop the `anvil` entry from the `chains` array in `src/rainbowKitConfig.tsx` so visitors don't see a network that points at their own machine.

## Known limitations

- Amounts must be typed in raw units — decimal parsing (`parseUnits`) is not implemented yet
- Only ERC20 tokens are supported; native ETH transfers need a different contract
- Recipient lists are not validated client-side — invalid lists revert on-chain and cost gas
- No transaction history view

## Troubleshooting

- **`returned no data ("0x")`** — there is no contract at that address on the connected chain. Almost always a wrong-network issue; check the network chip in the header.
- **Asked to approve on every send** — expected behaviour: the airdrop spends the allowance.
- **`tsender-deployed.json` fails to load** — the snapshot was produced by a different Anvil release. The copy in this repo is patched for Anvil 1.4.4; a pristine copy is kept as `tsender-deployed.backup.json`.
- **Airdrop reverts with "insufficient balance"** — wrong decimals. Use the Transaction Details panel to check the human-readable amount.
- **`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined`** — add it to `.env.local` (locally) or to the host's environment variables.

## Acknowledgements

- Built while following the [Cyfrin Updraft](https://updraft.cyfrin.io) full-stack Web3 course (TSender UI)
- Inspired by [t-sender.com](https://t-sender.com)

## License

No license has been chosen for this repository yet. Pick one before distributing or accepting contributions.
