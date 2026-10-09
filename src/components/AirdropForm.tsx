"use client";
import InputField from "@/components/ui/InputField";
import { useState } from "react";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useAccount, useChainId, useConfig } from "wagmi";
import { readContract } from "wagmi/actions";

export default function AirdropForm() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipients, setRecipients] = useState("");
  const [amounts, setAmounts] = useState("");
  const config = useConfig();
  const chainId = useChainId(); // state to hold the current chain ID which address user is connected to
  const account = useAccount();

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

    const tsenderContractAddress = chainsToTSender[chainId]["tsender"];
    const approvedAmount = await getApprovedAmount(tsenderContractAddress);
    console.log("Approved amount:", approvedAmount);
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
          className="mt-6 w-full rounded-[10px] bg-lime-400 px-6 py-3 text-sm font-semibold text-[#0b0d0a] transition-all duration-200 hover:brightness-105 hover:shadow-md active:scale-[0.99] sm:mt-8 sm:w-auto"
        >
          Send Token
        </button>
      </div>
    </div>
  );
}
