import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Setting } from '@/models/Setting';

export const dynamic = 'force-dynamic';

// GET /api/settings - Public store settings endpoint
export async function GET() {
  try {
    await connectDB();
    let settings = await Setting.findOne().lean();

    if (!settings) {
      await Setting.create({
        storeName: 'GRAVOZ Footwear',
        storeTagline: 'Premium Handcrafted Footwear & Leather Collections',
        contactEmail: 'support@gravoz.com',
        contactPhone: '+91 98765 43210',
        gstinTaxId: '32AAACL1902K1Z8',
        currencySymbol: '₹',
        currencyCode: 'INR',
        freeShippingThreshold: 999,
        codDeliveryCharge: 25,
        referralRewardCredit: 100,
        friendFirstOrderDiscountPercent: 15,
      });
      settings = await Setting.findOne().lean();
    }

    const s = settings as any;

    return NextResponse.json({
      success: true,
      settings: {
        storeName: s?.storeName || 'GRAVOZ Footwear',
        storeTagline: s?.storeTagline || 'Premium Handcrafted Footwear & Leather Collections',
        contactEmail: s?.contactEmail || 'support@gravoz.com',
        contactPhone: s?.contactPhone || '+91 98765 43210',
        gstinTaxId: s?.gstinTaxId || '32AAACL1902K1Z8',
        currencySymbol: s?.currencySymbol || '₹',
        freeShippingThreshold: Number(s?.freeShippingThreshold) || 999,
        codDeliveryCharge: s?.codDeliveryCharge !== undefined ? Number(s?.codDeliveryCharge) : 25,
        referralRewardCredit: Number(s?.referralRewardCredit) || 100,
        friendFirstOrderDiscountPercent: Number(s?.friendFirstOrderDiscountPercent) || 15,
      },
    });
  } catch (error: any) {
    console.error('Fetch frontend settings error:', error);
    return NextResponse.json({
      success: true,
      settings: {
        storeName: 'GRAVOZ Footwear',
        storeTagline: 'Premium Handcrafted Footwear & Leather Collections',
        contactEmail: 'support@gravoz.com',
        gstinTaxId: '32AAACL1902K1Z8',
        currencySymbol: '₹',
        freeShippingThreshold: 999,
        codDeliveryCharge: 25,
        referralRewardCredit: 100,
        friendFirstOrderDiscountPercent: 15,
      },
    });
  }
}
