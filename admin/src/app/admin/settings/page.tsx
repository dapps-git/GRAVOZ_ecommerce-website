'use client';

import { useState, useEffect } from 'react';
import { Save, Store, Gift, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('GRAVOZ Footwear');
  const [storeTagline, setStoreTagline] = useState('Premium Handcrafted Footwear & Leather Collections');
  const [contactEmail, setContactEmail] = useState('support@gravoz.com');
  const [gstinTaxId, setGstinTaxId] = useState('32AAACL1902K1Z8');

  const [freeShippingThreshold, setFreeShippingThreshold] = useState('999');
  const [codDeliveryCharge, setCodDeliveryCharge] = useState('25');
  const [referralRewardCredit, setReferralRewardCredit] = useState('100');
  const [friendFirstOrderDiscountPercent, setFriendFirstOrderDiscountPercent] = useState('15');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.storeName) setStoreName(data.storeName);
          if (data.storeTagline) setStoreTagline(data.storeTagline);
          if (data.contactEmail) setContactEmail(data.contactEmail);
          if (data.gstinTaxId) setGstinTaxId(data.gstinTaxId);

          if (data.freeShippingThreshold !== undefined) setFreeShippingThreshold(String(data.freeShippingThreshold));
          if (data.codDeliveryCharge !== undefined) setCodDeliveryCharge(String(data.codDeliveryCharge));
          if (data.referralRewardCredit !== undefined) setReferralRewardCredit(String(data.referralRewardCredit));
          if (data.friendFirstOrderDiscountPercent !== undefined) setFriendFirstOrderDiscountPercent(String(data.friendFirstOrderDiscountPercent));
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          storeTagline,
          contactEmail,
          gstinTaxId,
          freeShippingThreshold: Number(freeShippingThreshold),
          codDeliveryCharge: Number(codDeliveryCharge),
          referralRewardCredit: Number(referralRewardCredit),
          friendFirstOrderDiscountPercent: Number(friendFirstOrderDiscountPercent),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3500);
      } else {
        setErrorMessage(data.error || 'Failed to save settings.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
          STORE SETTINGS & CONFIGURATION
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure store profile, GST compliance, free delivery limits, COD charges, and referral bonuses.
        </p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-medium shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Store settings and COD charges updated successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-medium shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: General Store Information */}
        <div className="bg-white rounded-xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm sm:text-base border-b border-slate-100 pb-3.5">
            <Store className="w-5 h-5 text-emerald-700" />
            <span>General Store Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. GRAVOZ Footwear"
                className="w-full bg-[#fcfdfd] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Store Tagline
              </label>
              <input
                type="text"
                value={storeTagline}
                onChange={(e) => setStoreTagline(e.target.value)}
                placeholder="e.g. Premium Handcrafted Footwear & Leather Collections"
                className="w-full bg-[#fcfdfd] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="support@gravoz.com"
                className="w-full bg-[#fcfdfd] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                GSTIN Tax ID
              </label>
              <input
                type="text"
                value={gstinTaxId}
                onChange={(e) => setGstinTaxId(e.target.value.toUpperCase())}
                placeholder="e.g. 32AAACL1902K1Z8"
                className="w-full bg-[#fcfdfd] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium tracking-wide uppercase focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Delivery & Growth Engine Parameters */}
        <div className="bg-white rounded-xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm sm:text-base border-b border-slate-100 pb-3.5">
            <Gift className="w-5 h-5 text-emerald-700" />
            <span>Delivery & Growth Engine Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Free Shipping Order Min (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="w-full bg-[#fcfdfd] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-1">Orders above this qualify for free shipping</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                COD Delivery Charge (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={codDeliveryCharge}
                  onChange={(e) => setCodDeliveryCharge(e.target.value)}
                  className="w-full bg-[#fcfdfd] border border-amber-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                />
              </div>
              <p className="text-[10px] text-amber-700 font-medium mt-1">Default fee for Cash on Delivery orders (₹25)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Referral Reward Credit (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={referralRewardCredit}
                onChange={(e) => setReferralRewardCredit(e.target.value)}
                className="w-full bg-[#fcfdfd] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-1">Credit awarded to referrer after friend purchase</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Friend 1st Order Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={friendFirstOrderDiscountPercent}
                onChange={(e) => setFriendFirstOrderDiscountPercent(e.target.value)}
                className="w-full bg-[#fcfdfd] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-1">Welcome discount on friend&apos;s first purchase</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs sm:text-sm rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
