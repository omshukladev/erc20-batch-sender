"use client";
import InputField from "@/components/ui/InputField";
import { useEffect, useMemo, useRef, useState } from "react";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useAccount, useChainId, useConfig, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { formatUnits } from "viem";
import { calculateTotal } from "@/utils/calculateTotal/calculateTotal";

const STORAGE_KEY = "tsender-form-inputs";
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const STATUS_EXIT_MS = 150;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  10: "OP Mainnet",
  324: "zkSync Era",
  8453: "Base",
  42161: "Arbitrum One",
  11155111: "Sepolia",
  31337: "Anvil",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.name === "UserRejectedRequestError" ||
      /user (rejected|denied)/i.test(error.message)
    ) {
      return "You cancelled the request in your wallet. Nothing was sent.";
    }
    const { shortMessage } = error as { shortMessage?: string };
    return shortMessage ?? error.message;
  }
  return "Something went wrong. Please try again.";
}

function Spinner() {
  return (
    <svg
      className="loading-spinner h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SummaryRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/70 py-2.5 last:border-b-0">
      <dt className="font-mono text-[11px] tracking-[0.1em] text-ink-faint uppercase">
        {label}
      </dt>
      <dd
        className={`min-w-0 truncate text-right font-mono text-[13px] ${
          accent ? "text-signal" : "text-ink"
        }`}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

export default function AirdropForm() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipients, setRecipients] = useState("");
  const [amounts, setAmounts] = useState("");
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);
  const [phase, setPhase] = useState<"approve" | "airdrop" | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusDismissed, setStatusDismissed] = useState(false);
  const [statusLeaving, setStatusLeaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const statusExitTimer = useRef<number | null>(null);

  const config = useConfig();
  const chainId = useChainId();
  const account = useAccount();
  const total: number = useMemo(() => calculateTotal(amounts), [amounts]);

  const { isPending, writeContractAsync } = useWriteContract();
  const isBusy = isPending || isConfirming;

  const recipientList = useMemo(
    () =>
      recipients
        .split(/[, \n]+/)
        .map((addr) => addr.trim())
        .filter((addr) => addr !== ""),
    [recipients],
  );
  const amountList = useMemo(
    () =>
      amounts
        .split(/[, \n]+/)
        .map((amt) => amt.trim())
        .filter((amt) => amt !== ""),
    [amounts],
  );

  // load saved inputs once, after mount (localStorage is not available on the server)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          tokenAddress?: string;
          recipients?: string;
          amounts?: string;
        };
        setTokenAddress(parsed.tokenAddress ?? "");
        setRecipients(parsed.recipients ?? "");
        setAmounts(parsed.amounts ?? "");
      }
    } catch {
      // ignore unreadable or unavailable storage
    }
    setHasLoaded(true);
  }, []);

  // persist inputs on every change (only after the initial load, so we never wipe them)
  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tokenAddress, recipients, amounts }),
    );
  }, [tokenAddress, recipients, amounts, hasLoaded]);

  // clear a pending exit timer if the component goes away mid-dismissal
  useEffect(() => {
    return () => {
      if (statusExitTimer.current !== null) {
        window.clearTimeout(statusExitTimer.current);
      }
    };
  }, []);

  // read the token metadata to show details about what is being sent
  useEffect(() => {
    if (!ADDRESS_REGEX.test(tokenAddress)) {
      setTokenName(null);
      setTokenSymbol(null);
      setTokenDecimals(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [name, decimals] = await Promise.all([
          readContract(config, {
            abi: erc20Abi,
            address: tokenAddress as `0x${string}`,
            functionName: "name",
          }) as Promise<string>,
          readContract(config, {
            abi: erc20Abi,
            address: tokenAddress as `0x${string}`,
            functionName: "decimals",
          }) as Promise<number>,
        ]);
        if (cancelled) return;
        setTokenName(name);
        setTokenDecimals(Number(decimals));
        // symbol is best-effort: some tokens return bytes32 here and would throw
        try {
          const symbol = (await readContract(config, {
            abi: erc20Abi,
            address: tokenAddress as `0x${string}`,
            functionName: "symbol",
          })) as string;
          if (!cancelled) setTokenSymbol(symbol);
        } catch {
          if (!cancelled) setTokenSymbol(null);
        }
      } catch {
        if (cancelled) return;
        setTokenName(null);
        setTokenSymbol(null);
        setTokenDecimals(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config, chainId, tokenAddress]);

  const formattedTotal =
    tokenDecimals !== null && Number.isInteger(total)
      ? Number(formatUnits(BigInt(total), tokenDecimals)).toFixed(2)
      : null;

  const validToken = ADDRESS_REGEX.test(tokenAddress);
  const listsAligned =
    recipientList.length > 0 && recipientList.length === amountList.length;

  const checks = [
    {
      ok: Boolean(account.address),
      pass: "Wallet connected",
      fail: "Connect a wallet to sign",
    },
    {
      ok: validToken,
      pass: "Token address is valid",
      fail: "Enter a valid token address",
    },
    {
      ok: listsAligned,
      pass: `Lists aligned · ${recipientList.length} recipient${
        recipientList.length === 1 ? "" : "s"
      }`,
      fail:
        recipientList.length || amountList.length
          ? `Lists misaligned · ${recipientList.length} recipients, ${amountList.length} amounts`
          : "Add recipients and matching amounts",
    },
  ];

  const misalignedMessage =
    recipientList.length > 0 && !listsAligned
      ? `Recipients and amounts must line up. ${recipientList.length} recipient${
          recipientList.length === 1 ? "" : "s"
        } against ${amountList.length} amount${
          amountList.length === 1 ? "" : "s"
        }.`
      : undefined;

  const status = useMemo(() => {
    if (errorMessage) {
      return {
        kind: "error" as const,
        title: "Airdrop failed",
        detail: errorMessage,
      };
    }
    if (isSuccess) {
      return {
        kind: "success" as const,
        title: "Airdrop settled",
        detail: `${formattedTotal ?? total} ${tokenSymbol ?? "tokens"} sent to ${
          recipientList.length
        } recipient${recipientList.length === 1 ? "" : "s"}.`,
      };
    }
    if (isPending) {
      return {
        kind: "progress" as const,
        title: "Waiting on your wallet",
        detail:
          phase === "approve"
            ? "Confirm the approval so TSender can move your tokens."
            : "Confirm the airdrop to release the tokens.",
      };
    }
    if (isConfirming) {
      return {
        kind: "progress" as const,
        title: phase === "approve" ? "Approving tokens" : "Broadcasting airdrop",
        detail: "Submitted. Waiting for the network to confirm.",
      };
    }
    return null;
  }, [
    errorMessage,
    isSuccess,
    isPending,
    isConfirming,
    phase,
    formattedTotal,
    total,
    tokenSymbol,
    recipientList.length,
  ]);

  const showStatus = status && !(statusDismissed && status.kind !== "progress");

  // Let the card finish its exit before unmounting. Reduced motion skips the
  // wait so nothing lingers on screen with no animation to explain it.
  function dismissStatus() {
    if (prefersReducedMotion()) {
      setStatusDismissed(true);
      return;
    }
    setStatusLeaving(true);
    statusExitTimer.current = window.setTimeout(() => {
      setStatusDismissed(true);
      setStatusLeaving(false);
      statusExitTimer.current = null;
    }, STATUS_EXIT_MS);
  }

  // Announcements mirror into persistent live regions so screen readers pick them
  // up reliably. Inserting a polite region together with its content announces
  // inconsistently, so these exist from first render and only their text changes.
  const politeAnnouncement =
    status && status.kind !== "error" ? `${status.title}. ${status.detail}` : "";
  const alertAnnouncement =
    status && status.kind === "error" ? `${status.title}. ${status.detail}` : "";

  const buttonLabel = isPending
    ? "Check your wallet"
    : isConfirming
      ? phase === "approve"
        ? "Approving"
        : "Airdropping"
      : "Approve and send";

  async function getApprovedAmount(
    tSenderAddress: string | null,
  ): Promise<number> {
    if (!tSenderAddress) {
      throw new Error(
        "TSender isn't deployed on this network. Switch to a supported chain and try again.",
      );
    }
    const response = await readContract(config, {
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
      functionName: "allowance",
      args: [account.address, tSenderAddress as `0x${string}`],
    });
    return response as number;
  }

  async function handelSubmit() {
    if (isBusy) return;
    setIsSuccess(false);
    setErrorMessage(null);
    setPhase(null);
    setStatusDismissed(false);
    if (statusExitTimer.current !== null) {
      window.clearTimeout(statusExitTimer.current);
      statusExitTimer.current = null;
    }
    setStatusLeaving(false);

    if (!account.address) {
      setErrorMessage("Connect your wallet first.");
      return;
    }

    try {
      const tSenderAddress = chainsToTSender[chainId]?.["tsender"] ?? null;
      const approvedAmount = await getApprovedAmount(tSenderAddress);

      if (approvedAmount < total) {
        setPhase("approve");
        const approvalHash = await writeContractAsync({
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "approve",
          args: [tSenderAddress as `0x${string}`, BigInt(total)],
        });
        setIsConfirming(true);
        await waitForTransactionReceipt(config, { hash: approvalHash });
        setIsConfirming(false);
      }

      setPhase("airdrop");
      const airdropHash = await writeContractAsync({
        abi: tsenderAbi,
        address: tSenderAddress as `0x${string}`,
        functionName: "airdropERC20",
        args: [tokenAddress, recipientList, amountList, BigInt(total)],
      });
      setIsConfirming(true);
      await waitForTransactionReceipt(config, { hash: airdropHash });
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsConfirming(false);
    }
  }

  const statusTone =
    status?.kind === "error"
      ? "border-danger/40"
      : status?.kind === "success"
        ? "border-success/40"
        : "border-line";

  return (
    <div className="grid overflow-hidden rounded-[6px] border border-line bg-surface lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {/* Persistent live regions: created once, text swapped in place */}
      <div role="status" aria-live="polite" className="sr-only">
        {politeAnnouncement}
      </div>
      <div role="alert" className="sr-only">
        {alertAnnouncement}
      </div>

      {/* Workbench */}
      <div className="border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
            Batch builder
          </h2>
          <span className="font-mono text-[11px] text-ink-faint">
            {chainsToTSender[chainId]?.tsender
              ? (CHAIN_NAMES[chainId] ?? "Unsupported chain")
              : "Unsupported chain"}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <InputField
            index="01"
            label="Token address"
            placeholder="0x…"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />
          <InputField
            index="02"
            label="Recipients"
            placeholder={"0x1234…\n0x5678…"}
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            large={true}
            hint={`${recipientList.length} address${
              recipientList.length === 1 ? "" : "es"
            }`}
          />
          <InputField
            index="03"
            label="Amounts · raw units"
            placeholder={"1000000000000000000\n2500000000000000000"}
            value={amounts}
            onChange={(e) => setAmounts(e.target.value)}
            large={true}
            hint={`${amountList.length} value${amountList.length === 1 ? "" : "s"}`}
            errorMessage={misalignedMessage}
          />
        </div>

        <p className="mt-4 font-mono text-[11px] leading-relaxed text-ink-faint">
          One amount per address, in the token&apos;s smallest unit. USDC uses 6
          decimals — 1000000 is 1 USDC.
        </p>
      </div>

      {/* Run inspector */}
      <aside className="flex flex-col bg-surface-2 p-5 sm:p-7">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
          Run summary
        </h2>

        <dl className="mt-5">
          <SummaryRow
            label="Token"
            value={tokenSymbol ? `${tokenSymbol}` : tokenName ?? "—"}
          />
          <SummaryRow label="Recipients" value={String(recipientList.length)} />
          <SummaryRow
            label="Amount · wei"
            value={Number.isInteger(total) && total > 0 ? total : "—"}
          />
          <SummaryRow
            label="Amount · tokens"
            value={formattedTotal ?? "—"}
            accent
          />
        </dl>

        <ul className="mt-5 flex flex-col gap-2">
          {checks.map((check) => (
            <li
              key={check.pass}
              className={`flex items-start gap-2 font-mono text-[11px] leading-relaxed transition-colors duration-200 ${
                check.ok ? "text-ink-soft" : "text-progress"
              }`}
            >
              <span
                className={`swap-icon mt-px shrink-0 transition-colors duration-200 ${
                  check.ok ? "text-success" : "text-progress"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="swap-icon__item"
                  data-hidden={!check.ok}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span
                  aria-hidden="true"
                  className="swap-icon__item"
                  data-hidden={check.ok}
                >
                  ○
                </span>
              </span>
              <span>{check.ok ? check.pass : check.fail}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <button
            type="button"
            onClick={handelSubmit}
            aria-busy={isBusy}
            aria-disabled={isBusy}
            className={`group flex w-full items-center justify-between gap-3 rounded-[3px] bg-ink px-4 py-3 text-sm font-medium text-paper transition-[transform,opacity] duration-150 ease-out ${
              isBusy
                ? "cursor-not-allowed opacity-60"
                : "hover:-translate-y-px active:scale-[0.985] active:duration-75"
            }`}
          >
            <span className="flex items-center gap-2.5">
              {isBusy && <Spinner />}
              {buttonLabel}
            </span>
            <span
              aria-hidden="true"
              className="font-mono text-[11px] text-paper/50 transition-colors group-hover:text-signal-bright"
            >
              {recipientList.length} out
            </span>
          </button>
        </div>

        {showStatus && status && (
          <div
            key={status.kind}
            className={`status-card mt-4 rounded-[3px] border ${statusTone} bg-paper p-3 ${
              statusLeaving ? "status-card--out" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 shrink-0 ${
                  status.kind === "error"
                    ? "text-danger"
                    : status.kind === "success"
                      ? "text-success"
                      : "text-progress"
                }`}
              >
                {status.kind === "progress" ? (
                  <Spinner />
                ) : status.kind === "success" ? (
                  <CheckIcon />
                ) : (
                  <AlertIcon />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{status.title}</p>
                <p className="mt-1 text-xs leading-relaxed break-words text-ink-soft">
                  {status.detail}
                </p>
              </div>
              {status.kind !== "progress" && (
                <button
                  type="button"
                  onClick={dismissStatus}
                  aria-label="Dismiss status message"
                  className="-m-1 shrink-0 rounded-[3px] p-2 text-ink-faint transition-colors hover:text-ink"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
