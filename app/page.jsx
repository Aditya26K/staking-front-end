// pages/page.jsx (or app/page.jsx)
"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ConnectKitButton } from "connectkit";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { abi } from "./abi.ts"; // Ensure this is the correct ABI for your staking contract
import { tokenABI } from "./tokenAbi.ts"; // Ensure this is the correct ABI for your token contract

// Replace with your deployed contract addresses as strings:
const STAKING_CONTRACT_ADDRESS = "0x55844FC48e6B33E580eA7d16ACDB593802983B4E";
const PERSONAL_TOKEN_ADDRESS = "0x60DfeEA0C28Cd233111A30156C821ef02Aed2F95";

export default function Home() {
  const tokenDecimals =18
  const [stakeAmount, setStakeAmount] = useState("");
  const [durationIndex, setDurationIndex] = useState("0");
  const [status, setStatus] = useState("");
  const { address } = useAccount();
  
  const {
    data: userStakesData,
    refetch: refetchUserStakes,
    error: userStakesError,
    isFetching: isFetchingUserStakes,
  } = useReadContract({
    abi: abi,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "userStakes",
    args: [address],
  });

  // Use the `useWriteContract` hook for writing to the contract
  const { writeContractAsync } = useWriteContract();

 
 

  const handleStake = async (e) => {
    e.preventDefault();
    if (!address) {
      setStatus("Please connect your wallet.");
      return;
    }
    if (!stakeAmount || !durationIndex) {
      setStatus("Please enter both amount and duration.");
      return;
    }

    try {
      setStatus("Staking tokens...");

      // Convert the stake amount to the correct units (e.g., wei)
      const amountInTokens = ethers.parseUnits(stakeAmount, tokenDecimals);

      // Approve the staking contract to spend tokens
      await writeContractAsync({
        address: PERSONAL_TOKEN_ADDRESS,
        abi: tokenABI,
        functionName: "approve",
        args: [STAKING_CONTRACT_ADDRESS, amountInTokens],
      });

      // Stake tokens
      await writeContractAsync({
        address: STAKING_CONTRACT_ADDRESS,
        abi: abi,
        functionName: "stakeTokens",
        args: [durationIndex, amountInTokens],
      });

      setStatus("Staking successful!");
      await refetchUserStakes(); // Refetch stake details after staking
    } catch (error) {
      console.error("Error staking tokens:", error);
      setStatus("Error staking tokens.");
    }
  };

  const handleWithdraw = async () => {
    if (!address) {
      setStatus("Please connect your wallet.");
      return;
    }

    try {
      setStatus("Withdrawing tokens...");

      // Withdraw tokens
      await writeContractAsync({
        address: STAKING_CONTRACT_ADDRESS,
        abi: abi,
        functionName: "withdraw",
      });

      setStatus("Withdrawal successful!");
      await refetchUserStakes(); // Refetch stake details after withdrawal
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      setStatus("Error withdrawing tokens.");
    }
  };

  // Function to handle fetching user stakes


  
  

  return (
    // <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Staking DApp
        </h1>
        <div className="flex items-center gap-4">
          {address && <span className="text-sm text-gray-400">Connected as: {address.slice(0, 6)}...{address.slice(-4)}</span>}
          <ConnectKitButton />
        </div>
      </header>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-gray-700 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-purple-400">Your Stake Details</h3>
        {isFetchingUserStakes ? (
          <div className="p-4 text-gray-400">Loading stake details...</div>
        ) : userStakesData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-400">Staked Amount</p>
              <p className="font-medium text-lg">{Number(userStakesData[0])/10**tokenDecimals} Tokens</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400">Duration</p>
              <p className="font-medium text-lg">{Math.round(Number(userStakesData[1] )/ 60)} Minutes</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400">Start Time</p>
              <p className="font-medium text-lg">
                {new Date(Number(userStakesData[2]) * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 text-gray-400">No active stakes found.</div>
        )}
      </div>

      

      <div className="space-y-8">
        {/* Stake Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Stake Tokens</h2>
          <form onSubmit={handleStake} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Amount to Stake</label>
              <input
                type="text"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 bg-gray-700/50 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Staking Duration</label>
              <div className="grid grid-cols-3 gap-3">
                {['0', '1', '2'].map((index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setDurationIndex(index)}
                    className={`px-4 py-2 rounded-md transition-all ${
                      durationIndex === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {index === '0' ? '1 Min' : index === '1' ? '2 Min' : '3 Min'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={isFetchingUserStakes}
            >
              {isFetchingUserStakes ? 'Processing...' : 'Stake Tokens'}
            </button>
          </form>
        </div>

        {/* Withdraw Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Withdraw Stake</h2>
          <div className="space-y-4">
            <button
              onClick={handleWithdraw}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-cyan-600 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={isFetchingUserStakes}
            >
              {isFetchingUserStakes ? 'Processing...' : 'Withdraw Tokens'}
            </button>
          </div>
        </div>

        <div className="space-y-8">
      {/* Stake and Withdraw Cards unchanged */}
      
      {userStakesError && (
        <div className="p-4 bg-red-500/20 rounded-lg border border-red-500 text-red-400">
          Error fetching stake details: {userStakesError.message}
        </div>
      )}

      
        {/* Status Messages */}
        {status && (
          <div className="p-4 bg-gray-800/70 rounded-lg border border-gray-700 flex items-center gap-3">
            {status.includes('success') ? (
              <>
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <p className="text-green-400">{status}</p>
              </>
            ) : (
              <>
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  !
                </div>
                <p className="text-red-400">{status}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}