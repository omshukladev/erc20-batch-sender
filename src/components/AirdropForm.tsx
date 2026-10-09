"use client";
import InputField from "@/components/ui/InputField";
import { useEffect, useMemo, useState } from "react";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useAccount, useChainId, useConfig, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { formatUnits } from "viem";
import { calculateTotal } from "@/utils/calculateTotal/calculateTotal";

const STORAGE_KEY = "tsender-form-inputs";
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.name === "UserRejectedRequestError" ||
      /user (rejected|denied)/i.test(error.message)
    ) {
      return "Transaction cancelled in your wallet.";
    }
    const { shortMessage } = error as { shortMessage?: string };
    return shortMessage ?? error.message;
  }
  return "Something went wrong. Please try again.";
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
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

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
  const [hasLoaded, setHasLoaded] = useState(false);

  const config = useConfig();
  const chainId = useChainId(); // state to hold the current chain ID which address user is connected to
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

  const status = useMemo(() => {
    if (errorMessage) {
      return {
        kind: "error" as const,
        title: "Transaction failed",
        detail: errorMessage,
      };
    }
    if (isSuccess) {
      return {
        kind: "success" as const,
        title: "Airdrop complete",
        detail: `${formattedTotal ?? total} ${tokenSymbol ?? "tokens"} sent to ${
          recipientList.length
        } recipient${recipientList.length === 1 ? "" : "s"}.`,
      };
    }
    if (isPending) {
      return {
        kind: "progress" as const,
        title: "Waiting for your wallet",
        detail:
          phase === "approve"
            ? "Confirm the approval in MetaMask so TSender can move your tokens."
            : "Confirm the airdrop in MetaMask to send the tokens.",
      };
    }
    if (isConfirming) {
      return {
        kind: "progress" as const,
        title: phase === "approve" ? "Approving tokens" : "Sending airdrop",
        detail: "Transaction submitted — waiting for the network to confirm it.",
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

  const buttonLabel = isPending
    ? "Check your wallet…"
    : isConfirming
      ? phase === "approve"
        ? "Approving…"
        : "Airdropping…"
      : "Send Token";

  async function getApprovedAmount(
    tSenderAddress: string | null,
  ): Promise<number> {
    if (!tSenderAddress) {
      alert("No address found, please use a supported chain");
      return 0;
    }
    // read from the chain to see if we have approved enough token
    const response = await readContract(config, {
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
      functionName: "allowance",
      args: [account.address, tSenderAddress as `0x${string}`],
    });
    // token.allowance(account,tsender)
    return response as number;
  }

  async function handelSubmit() {
    // 1a. If already approved, moved to step 2. --> contract address of tsender contract
    // 1b. Approve our tsender contract to send our tokens. -->token address of the token we want to send
    // 2. Call the airdrop function on the tsender contract
    // 3. Wait for the transaction to be mined

    // Get the tsender contract address for the current chain the tsender in bracker ["tsender"] is the key of the object which
    // holds the contract address for the tsender contract for that chain we will use this address to call the airdrop function on
    // the tsender contract

    setIsSuccess(false);
    setErrorMessage(null);
    setPhase(null);
    setStatusDismissed(false);

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
        console.log("Approval transaction mined:", approvalHash);
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
      console.log("Airdrop transaction mined:", airdropHash);
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-6 lg:p-8 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-5 sm:gap-6">
          <InputField
            label="Token Address"
            placeholder="0x"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />
          <InputField
            label="Recipients"
            placeholder="0x12314, 0x12342342"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            large={true}
          />
          <InputField
            label="Amount"
            placeholder="100, 200, 300, ..."
            value={amounts}
            onChange={(e) => setAmounts(e.target.value)}
            large={true}
          />
        </div>

        <button
          onClick={handelSubmit}
          disabled={isBusy}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-lime-400 px-6 py-3 text-sm font-semibold text-[#0b0d0a] transition-all duration-200 hover:brightness-105 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100 disabled:active:scale-100 sm:mt-8 sm:w-auto"
        >
          {isBusy && <Spinner />}
          {buttonLabel}
        </button>

        {tokenName && (
          <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 sm:mt-8 sm:p-5 dark:border-white/10 dark:bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-black/80 dark:text-white/80">
              Transaction Details
            </h3>
            <dl className="mt-3 flex flex-col gap-2.5 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-black/55 dark:text-white/55">
                  Token Name:
                </dt>
                <dd className="text-right font-mono break-all text-black/85 dark:text-white/85">
                  {tokenName}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-black/55 dark:text-white/55">
                  Amount (wei):
                </dt>
                <dd className="text-right font-mono break-all text-black/85 dark:text-white/85">
                  {Number.isInteger(total) ? total : "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-black/55 dark:text-white/55">
                  Amount (tokens):
                </dt>
                <dd className="text-right font-mono break-all text-black/85 dark:text-white/85">
                  {formattedTotal ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {showStatus && status && (
        <div
          role={status.kind === "error" ? "alert" : "status"}
          className={`fixed right-4 bottom-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border p-4 shadow-lg backdrop-blur ${
            status.kind === "error"
              ? "border-red-500/25 bg-red-500/[0.08] dark:bg-red-500/[0.12]"
              : "border-black/10 bg-white/95 dark:border-white/10 dark:bg-[#121212]/95"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 shrink-0 ${
                status.kind === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-lime-600 dark:text-lime-400"
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
              <p className="text-sm font-semibold text-black/85 dark:text-white/90">
                {status.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed break-words text-black/60 dark:text-white/60">
                {status.detail}
              </p>
            </div>
            {status.kind !== "progress" && (
              <button
                onClick={() => setStatusDismissed(true)}
                aria-label="Dismiss"
                className="-mt-1 -mr-1 shrink-0 rounded-md p-1 text-black/40 transition-colors hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
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
    </div>
  );
}

//?  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
