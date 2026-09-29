'use client';

import { useState, useEffect } from 'react';
import {
  Gift,
  Users,
  IndianRupee,
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface ReferralItem {
  _id: string;
  referralCode: string;
  referrer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    referralCode: string;
    referralDiscountBalance?: number;
    rewardPoints?: number;
    tier?: string;
  };
  referredUser: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    referralCode?: string;
    totalOrders?: number;
    totalSpent?: number;
    createdAt: string;
    tier?: string;
  };
  status: string;
  referredDiscountPercent: number;
  referredDiscountUsed: boolean;
  referrerDiscountAmount: number;
  referrerDiscountAvailable: boolean;
  referrerDiscountUsed: boolean;
  hasPurchased: boolean;
  ordersCount: number;
  totalPurchasedAmount: number;
  createdAt: string;
}

interface ReferralStats {
  totalReferredUsers: number;
  totalPurchasedUsers: number;
  pendingPurchases: number;
  conversionRate: string;
  totalReferralRevenue: number;
  totalRewardsCredited: number;
  activeReferrersCount: number;
}

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referrals');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setReferrals(data.referrals || []);
      }
    } catch (err) {
      console.error('Error loading referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sansation">
      {/* Top Header & Compact Summary Cards */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Title Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="text-[#89591C]">
              <Gift className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Referral Program &amp; Rewards Activity
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#f5ede3] text-[#89591C] font-bold text-[10px] uppercase tracking-wider border border-[#ebdccb]">
              LIVE REWARDS FEED
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Track who shared their referral code, who got referred, and the reward amounts credited to each user
          </p>
        </div>

        {/* 3 Top Summary Cards */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Card 1: Total Referrals */}
          <div className="px-4 py-2.5 bg-white rounded-xl border border-[#e8e2d8] shadow-2xs flex items-center gap-3 min-w-[140px]">
            <div className="text-slate-500">
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                TOTAL REFERRALS
              </span>
              <span className="text-base font-bold text-slate-900 leading-tight block">
                {stats?.totalReferredUsers || referrals.length || 0}
              </span>
            </div>
          </div>

          {/* Card 2: Referrer Rewards */}
          <div className="px-4 py-2.5 bg-white rounded-xl border border-[#e8e2d8] shadow-2xs flex items-center gap-3 min-w-[160px]">
            <div className="text-emerald-600 font-bold text-sm">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                REFERRER REWARDS
              </span>
              <span className="text-base font-bold text-emerald-700 leading-tight block">
                ₹{(stats?.totalRewardsCredited || 0).toLocaleString()} Earned
              </span>
            </div>
          </div>

          {/* Card 3: Friend Benefit */}
          <div className="px-4 py-2.5 bg-white rounded-xl border border-[#e8e2d8] shadow-2xs flex items-center gap-3 min-w-[160px]">
            <div className="text-amber-600">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                FRIEND BENEFIT
              </span>
              <span className="text-base font-bold text-[#89591C] leading-tight block">
                15% OFF 1st Order
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#e8e2d8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5]/80 border-b border-[#e8e2d8] text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-4 px-6">REFERRER USER (SHARED BY)</th>
                <th className="py-4 px-5">REFERRER AMOUNT GOT</th>
                <th className="py-4 px-6">REFERRED USER (FRIEND)</th>
                <th className="py-4 px-6">REFERRED USER BENEFIT</th>
                <th className="py-4 px-5 text-center">STATUS</th>
                <th className="py-4 px-6 text-right">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eae1] text-xs text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#89591C]" />
                    Loading referral activity...
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    No referral records found.
                  </td>
                </tr>
              ) : (
                referrals.map((ref) => {
                  const isCompleted = ref.hasPurchased;

                  return (
                    <tr key={ref._id} className="hover:bg-[#faf8f5]/60 transition-colors">
                      {/* Referrer User (Shared By) */}
                      <td className="py-4 px-6 align-top">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block text-xs">
                            {ref.referrer?.name || 'Unknown Referrer'}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-normal">
                            {ref.referrer?.email || 'N/A'}
                          </span>
                          <div className="inline-block px-2 py-0.5 rounded bg-[#f5ede3] text-[#89591C] border border-[#ebdccb] text-[10px] font-mono font-semibold mt-1">
                            Code: {ref.referralCode}
                          </div>
                        </div>
                      </td>

                      {/* Referrer Amount Got */}
                      <td className="py-4 px-5 align-top">
                        <div className="space-y-1.5">
                          <span className="font-bold text-emerald-700 text-xs block">
                            +₹100
                          </span>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Credited to Balance
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending 1st Order
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Referred User (Friend) */}
                      <td className="py-4 px-6 align-top">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block text-xs">
                            {ref.referredUser?.name || 'Friend User'}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-normal">
                            {ref.referredUser?.email || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Referred User Benefit */}
                      <td className="py-4 px-6 align-top">
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-900 text-xs block">
                            15% OFF First Order
                          </span>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                              Discount Redeemed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                              Discount Available
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 align-top text-center">
                        {isCompleted ? (
                          <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Pending First Order
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 align-top text-right text-[11px] text-slate-600 font-medium">
                        {formatDate(ref.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
