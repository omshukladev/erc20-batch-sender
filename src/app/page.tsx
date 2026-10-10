import AirdropForm from "@/components/AirdropForm";
import { chainsToTSender } from "@/constants";

const GITHUB_REPO_URL = "https://github.com/omshukladev/erc20-batch-sender";

const NETWORKS = [
  { id: 1, name: "Ethereum" },
  { id: 8453, name: "Base" },
  { id: 42161, name: "Arbitrum" },
  { id: 10, name: "Optimism" },
  { id: 324, name: "zkSync Era" },
  { id: 11155111, name: "Sepolia" },
  { id: 31337, name: "Anvil (local)" },
];

const STEPS = [
  {
    title: "Paste a token",
    body: "Any ERC20 contract address — USDC, DAI, or a token you deployed yourself.",
  },
  {
    title: "List recipients + amounts",
    body: "One address per line, and one matching amount per line next to it.",
  },
  {
    title: "Approve and send",
    body: "Two signatures, one transaction: every wallet gets paid in the same block.",
  },
];

const NOTES = [
  {
    lead: "Amounts are in the token's smallest unit.",
    body: "USDC uses 6 decimals, so 1000000 is 1 USDC. Most tokens use 18, where 1000000000000000000 is 1 token.",
  },
  {
    lead: "Recipient and amount counts must match.",
    body: "One amount per address — otherwise the contract rejects the whole airdrop.",
  },
  {
    lead: "Recipients need nothing.",
    body: "No gas, no setup. The contract moves the tokens and the sending wallet pays the fee.",
  },
  {
    lead: "Approvals are per send.",
    body: "Each airdrop spends the allowance, so your next send asks you to approve again.",
  },
  {
    lead: "The token must exist on your network.",
    body: "The same address on another chain may not be a token at all — check the network chip first.",
  },
  {
    lead: "Testing is free.",
    body: "Grab testnet ETH for gas plus a test token, paste its address, and try it without risking real funds.",
  },
];

const FACTS = [
  { label: "Custody", value: "Non-custodial — you sign every transfer" },
  { label: "Signatures", value: "1 approval + 1 airdrop" },
  { label: "Recipients", value: "Unlimited, paid in a single block" },
];

function shortAddress(address: string) {
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}

export default function Home() {
  const supportedNetworks = NETWORKS.filter(
    (network) => chainsToTSender[network.id]?.tsender,
  );

  return (
    <main
      id="main"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
    >
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line py-10 sm:py-14 lg:py-20">
        <div
          aria-hidden="true"
          className="paper-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(120%_90%_at_78%_0%,black,transparent_68%)]"
        />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-ink-soft uppercase">
              <span className="h-2 w-2 bg-signal" aria-hidden="true" />
              Batch ERC20 transfer
            </span>
            <h1 className="mt-5 max-w-[16ch] font-display text-[34px] leading-[1.06] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Send one token to a whole list of wallets.
            </h1>
            <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-ink-soft sm:text-base">
              One approval, one transaction, everyone paid. TSender never holds
              your tokens — you approve once and the contract distributes to
              every address at the same time.
            </p>
          </div>

          <dl className="border-t border-line lg:border-t-0">
            {FACTS.map((fact) => (
              <div
                key={fact.label}
                className="flex flex-col gap-1 border-b border-line py-3.5 sm:flex-row sm:items-baseline sm:gap-4 lg:py-4"
              >
                <dt className="w-28 shrink-0 font-mono text-[11px] tracking-[0.16em] text-ink-faint uppercase">
                  {fact.label}
                </dt>
                <dd className="text-sm text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Workbench */}
      <section className="py-10 sm:py-14" aria-label="Airdrop builder">
        <AirdropForm />
      </section>

      {/* Runbook */}
      <section className="border-t border-line py-12 sm:py-16">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
          How it works
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-line-strong pt-4">
              <span className="font-mono text-xs font-medium text-signal">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl leading-snug font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Good to know */}
      <section className="border-t border-line py-12 sm:py-16">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
          Good to know
        </h2>
        <ul className="mt-8 grid gap-x-12 gap-y-6 lg:grid-cols-2">
          {NOTES.map((note) => (
            <li
              key={note.lead}
              className="grid grid-cols-[auto_1fr] gap-x-3 border-t border-line pt-4"
            >
              <span
                className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-signal"
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">{note.lead}</span>{" "}
                {note.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Network ledger */}
      <section className="border-t border-line py-12 sm:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
            Deployment ledger
          </h2>
          <span className="font-mono text-[11px] text-ink-faint">
            {supportedNetworks.length} live deployments
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <caption className="sr-only">
              TSender contract address and chain ID for every supported network
            </caption>
            <thead>
              <tr className="border-b border-line-strong">
                <th
                  scope="col"
                  className="py-2.5 pr-4 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-faint uppercase"
                >
                  Network
                </th>
                <th
                  scope="col"
                  className="py-2.5 pr-4 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-faint uppercase"
                >
                  Chain ID
                </th>
                <th
                  scope="col"
                  className="py-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-faint uppercase"
                >
                  TSender contract
                </th>
              </tr>
            </thead>
            <tbody>
              {supportedNetworks.map((network) => {
                const address = chainsToTSender[network.id].tsender;
                return (
                  <tr
                    key={network.id}
                    className="border-b border-line transition-colors hover:bg-surface-2"
                  >
                    <td className="py-3 pr-4 text-sm text-ink">
                      {network.name}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-ink-soft">
                      {network.id}
                    </td>
                    <td
                      className="py-3 font-mono text-[13px] text-ink-soft"
                      title={address}
                    >
                      <span aria-hidden="true">{shortAddress(address)}</span>
                      <span className="sr-only">{address}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-[60ch] text-xs leading-relaxed text-ink-faint">
          Connect to one of these and TSender uses the contract deployed there.
          On a network it doesn&apos;t know, it tells you instead of guessing.
        </p>
      </section>

      <footer className="flex flex-col gap-3 border-t border-line py-8 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono tracking-[0.08em] uppercase">
          Non-custodial · your keys, your tokens, your transactions
        </p>
        <nav aria-label="Footer" className="flex items-center gap-5 font-mono">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center transition-colors hover:text-ink"
          >
            Source
          </a>
          <a
            href="https://t-sender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center transition-colors hover:text-ink"
          >
            Inspired by t-sender.com
          </a>
        </nav>
      </footer>
    </main>
  );
}
