"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { BNPL_CORE_ADDRESS } from "@/lib/constants";

// ABI for BNPLCore default handling functions
const BNPL_CORE_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "_loanId", type: "uint256" }],
    name: "markAsDefaulted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "blacklistUser",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "unblacklistUser",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "isBlacklisted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalLoans",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "loans",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "borrower", type: "address" },
      { internalType: "address", name: "merchant", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "amountRepaid", type: "uint256" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint256", name: "dueDate", type: "uint256" },
      { internalType: "uint256", name: "repaidAt", type: "uint256" },
      { internalType: "bool", name: "isRepaid", type: "bool" },
      { internalType: "uint8", name: "status", type: "uint8" },
      { internalType: "uint256", name: "gracePeriodEnd", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface Loan {
  id: bigint;
  borrower: string;
  merchant: string;
  amount: bigint;
  amountRepaid: bigint;
  createdAt: bigint;
  dueDate: bigint;
  repaidAt: bigint;
  isRepaid: boolean;
  status: number;
  gracePeriodEnd: bigint;
}

type LoanStatus = "Active" | "Repaid" | "Defaulted";

export default function DefaultManagementPage() {
  const { address, isConnected } = useAccount();
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  // Read total loans
  const { data: totalLoans } = useReadContract({
    address: BNPL_CORE_ADDRESS,
    abi: BNPL_CORE_ABI,
    functionName: "totalLoans",
  });

  // Contract write hooks
  const {
    writeContract: markDefaulted,
    data: markDefaultedHash,
    isPending: isMarkingDefaulted,
  } = useWriteContract();

  const {
    writeContract: blacklistUser,
    data: blacklistHash,
    isPending: isBlacklisting,
  } = useWriteContract();

  const {
    writeContract: unblacklistUser,
    data: unblacklistHash,
    isPending: isUnblacklisting,
  } = useWriteContract();

  // Wait for transaction confirmations
  const { isSuccess: markDefaultedSuccess } = useWaitForTransactionReceipt({
    hash: markDefaultedHash,
  });

  const { isSuccess: blacklistSuccess } = useWaitForTransactionReceipt({
    hash: blacklistHash,
  });

  const { isSuccess: unblacklistSuccess } = useWaitForTransactionReceipt({
    hash: unblacklistHash,
  });

  // Read blacklist status for selected address
  const { data: isBlacklisted, refetch: refetchBlacklist } = useReadContract({
    address: BNPL_CORE_ADDRESS,
    abi: BNPL_CORE_ABI,
    functionName: "isBlacklisted",
    args: selectedAddress ? [selectedAddress as `0x${string}`] : undefined,
  });

  // Fetch all loans
  useEffect(() => {
    const fetchLoans = async () => {
      if (!totalLoans) return;

      setLoadingLoans(true);
      const loanPromises = [];

      for (let i = 1; i <= Number(totalLoans); i++) {
        loanPromises.push(
          fetch(`/api/loans/${i}`, { method: "GET" })
            .then((res) => res.json())
            .catch(() => null)
        );
      }

      // For now, we'll use a simplified approach with contract reads
      // In production, you'd want to use events or a subgraph
      setLoadingLoans(false);
    };

    fetchLoans();
  }, [totalLoans]);

  // Refetch data after transactions
  useEffect(() => {
    if (markDefaultedSuccess || blacklistSuccess || unblacklistSuccess) {
      refetchBlacklist();
      // Refetch loans here if using a proper data fetching strategy
    }
  }, [markDefaultedSuccess, blacklistSuccess, unblacklistSuccess]);

  const handleMarkDefaulted = async (loanId: bigint) => {
    try {
      await markDefaulted({
        address: BNPL_CORE_ADDRESS,
        abi: BNPL_CORE_ABI,
        functionName: "markAsDefaulted",
        args: [loanId],
      });
    } catch (error) {
      console.error("Error marking loan as defaulted:", error);
    }
  };

  const handleBlacklist = async () => {
    if (!selectedAddress) return;
    try {
      await blacklistUser({
        address: BNPL_CORE_ADDRESS,
        abi: BNPL_CORE_ABI,
        functionName: "blacklistUser",
        args: [selectedAddress as `0x${string}`],
      });
    } catch (error) {
      console.error("Error blacklisting user:", error);
    }
  };

  const handleUnblacklist = async () => {
    if (!selectedAddress) return;
    try {
      await unblacklistUser({
        address: BNPL_CORE_ADDRESS,
        abi: BNPL_CORE_ABI,
        functionName: "unblacklistUser",
        args: [selectedAddress as `0x${string}`],
      });
    } catch (error) {
      console.error("Error unblacklisting user:", error);
    }
  };

  const getStatusBadge = (status: number): { text: LoanStatus; color: string } => {
    switch (status) {
      case 0:
        return { text: "Active", color: "bg-blue-100 text-blue-800" };
      case 1:
        return { text: "Repaid", color: "bg-green-100 text-green-800" };
      case 2:
        return { text: "Defaulted", color: "bg-red-100 text-red-800" };
      default:
        return { text: "Active", color: "bg-gray-100 text-gray-800" };
    }
  };

  const getGracePeriodStatus = (gracePeriodEnd: bigint, status: number) => {
    if (status !== 0) return null; // Only for active loans

    const now = BigInt(Math.floor(Date.now() / 1000));
    const remaining = gracePeriodEnd - now;

    if (remaining <= BigInt(0)) {
      return {
        text: "Grace Period Expired",
        color: "text-red-600",
        canMarkDefaulted: true,
      };
    }

    const days = Number(remaining) / (24 * 60 * 60);
    return {
      text: `${days.toFixed(1)} days remaining`,
      color: days < 3 ? "text-orange-600" : "text-green-600",
      canMarkDefaulted: false,
    };
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Please connect your wallet to access admin features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 iceberg-regular">Default Management</h1>
          <p className="text-gray-600">Manage loan defaults, grace periods, and user blacklist</p>
        </div>

        {/* Blacklist Management Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Blacklist Management</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {selectedAddress && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">Status: </span>
                  <span
                    className={`text-sm font-bold ${
                      isBlacklisted ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {isBlacklisted ? "🚫 Blacklisted" : "✅ Active"}
                  </span>
                </div>

                {isBlacklisted ? (
                  <button
                    onClick={handleUnblacklist}
                    disabled={isUnblacklisting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUnblacklisting ? "Processing..." : "Unblacklist"}
                  </button>
                ) : (
                  <button
                    onClick={handleBlacklist}
                    disabled={isBlacklisting}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBlacklisting ? "Processing..." : "Blacklist"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loan List Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active & Defaulted Loans</h2>

          {loadingLoans ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading loans...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {totalLoans && Number(totalLoans) > 0 ? (
                <div className="text-sm text-gray-600 mb-4">
                  Total loans: {Number(totalLoans)}
                  <br />
                  <span className="text-xs text-gray-500">
                    Note: Detailed loan display requires event indexing or subgraph integration
                  </span>
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No loans found</p>
              )}

              {/* Placeholder for loan cards - would be populated with actual loan data */}
              <div className="text-sm text-gray-500 p-4 bg-blue-50 rounded-lg">
                💡 <strong>Implementation Note:</strong> In production, you would:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Use event logs to track all loans efficiently</li>
                  <li>Implement a subgraph (The Graph) for querying loan data</li>
                  <li>
                    Or use a backend indexer to cache loan states and serve them via API
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Grace Period Info */}
        <div className="mt-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Grace Period Rules</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">⏰</div>
              <div className="font-semibold text-gray-900">7 Days</div>
              <div className="text-gray-600">Grace period duration</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">💸</div>
              <div className="font-semibold text-gray-900">10% Penalty</div>
              <div className="text-gray-600">Late repayment fee</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">🚫</div>
              <div className="font-semibold text-gray-900">-20 Points</div>
              <div className="text-gray-600">Default penalty</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
