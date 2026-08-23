'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('GRAVOZ Shoes');
  const [contactEmail, setContactEmail] = useState('support@gravoz.com');
  const [contactPhone, setContactPhone] = useState('+1 (800) 555-GRAV');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [taxRatePercent, setTaxRatePercent] = useState('5');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('100');
  const [flatShippingRate, setFlatShippingRate] = useState('15');
  const [bannerMessage, setBannerMessage] = useState('Welcome to GRAVOZ - Premium Shoes for Men, Women & Babies');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data._id) {
          setStoreName(data.storeName || 'GRAVOZ Shoes');
          setContactEmail(data.contactEmail || 'support@gravoz.com');
          setContactPhone(data.contactPhone || '+1 (800) 555-GRAV');
          setCurrencySymbol(data.currencySymbol || '$');
          setTaxRatePercent(data.taxRatePercent?.toString() || '5');
          setFreeShippingThreshold(data.freeShippingThreshold?.toString() || '100');
          setFlatShippingRate(data.flatShippingRate?.toString() || '15');
          setBannerMessage(data.bannerMessage || '');
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          contactEmail,
          contactPhone,
          currencySymbol,
          taxRatePercent: Number(taxRatePercent),
          freeShippingThreshold: Number(freeShippingThreshold),
          flatShippingRate: Number(flatShippingRate),
          bannerMessage,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 font-light">
      <div className="border-b border-[#e8e2d8] pb-3">
        <p className="text-xs text-slate-500 font-normal">Configure global rates, shipping thresholds, and Cloudinary parameters</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-md flex items-center justify-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Store Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Store Profile */}
        <div className="bg-white rounded-md p-4 border border-[#e8e2d8] shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2">
            Store Profile & Contacts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Support Email
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Support Phone
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>
        </div>

        {/* Taxes & Shipping Calculations */}
        <div className="bg-white rounded-md p-4 border border-[#e8e2d8] shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2">
            Automated Calculations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Free Shipping Threshold ($)
              </label>
              <input
                type="number"
                required
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Flat Shipping Fee ($)
              </label>
              <input
                type="number"
                required
                value={flatShippingRate}
                onChange={(e) => setFlatShippingRate(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Top Announcement Banner Text
            </label>
            <input
              type="text"
              value={bannerMessage}
              onChange={(e) => setBannerMessage(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-[#89591C] hover:bg-[#724816] text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving Settings...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
