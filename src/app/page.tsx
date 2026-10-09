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

export default function Home() {
  const supportedNetworks = NETWORKS.filter(
    (network) => chainsToTSender[network.id]?.tsender,
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
      <section>
        <span className="inline-block rounded-full border border-black/10 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-black/45 uppercase dark:border-white/15 dark:text-white/45">
          Batch ERC20 transfers
        </span>
        <h1 className="mt-4 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          Send tokens to a whole list of wallets at once
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-black/60 dark:text-white/60">
          TSender airdrops an ERC20 token to every recipient in a single transaction.
          Instead of sending one transfer at a time, you approve once and the contract
          pays everyone — cheaper, faster, and far less clicking. It never holds your
          funds; you sign every transaction in your own wallet.
        </p>
      </section>

      <section className="mt-8 sm:mt-10">
        <AirdropForm />
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="font-mono text-[11px] tracking-[0.16em] text-black/45 uppercase dark:text-white/45">
          How it works
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-400 font-mono text-[11px] font-semibold text-[#0b0d0a]">
                {index + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-black/55 dark:text-white/55">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 sm:mt-14">
        <h2 className="font-mono text-[11px] tracking-[0.16em] text-black/45 uppercase dark:text-white/45">
          Good to know
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {NOTES.map((note) => (
            <li key={note.lead} className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
              <p className="text-sm leading-relaxed text-black/60 dark:text-white/60">
                <span className="font-medium text-black/85 dark:text-white/85">
                  {note.lead}
                </span>{" "}
                {note.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 sm:mt-14">
        <h2 className="font-mono text-[11px] tracking-[0.16em] text-black/45 uppercase dark:text-white/45">
          Supported networks
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {supportedNetworks.map((network) => (
            <span
              key={network.id}
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-black/65 dark:border-white/15 dark:text-white/65"
            >
              {network.name}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-black/45 dark:text-white/45">
          Connect to any of these and TSender uses the contract deployed there. On a
          network it doesn&apos;t know, it&apos;ll tell you instead of guessing.
        </p>
      </section>

      <footer className="mt-12 flex flex-col gap-3 border-t border-black/10 pt-6 text-xs text-black/45 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-white/45">
        <p>Non-custodial. Your keys, your tokens, your transactions.</p>
        <div className="flex items-center gap-4">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            Source code
          </a>
          <a
            href="https://t-sender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            Inspired by t-sender.com
          </a>
        </div>
      </footer>
    </main>
  );
}
