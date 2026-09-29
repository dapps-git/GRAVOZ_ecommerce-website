import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Setting } from '@/models/Setting';
import { getCache, setCache, invalidateCache } from '@/lib/redis';
import { requireAdmin } from '@/lib/api-guard';

// GET /api/settings - Fetch current store settings
export async function GET() {
  try {
    const cacheKey = 'store:settings';
    const cached = await getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

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

    await setCache(cacheKey, settings, 3600);
    return NextResponse.json(settings);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/settings - Protected Admin API to update store settings
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    await connectDB();
    const body = await req.json();

    // Validate and sanitize numeric fields
    const updateData: Record<string, any> = {};

    if (body.storeName !== undefined) updateData.storeName = String(body.storeName).trim();
    if (body.storeTagline !== undefined) updateData.storeTagline = String(body.storeTagline).trim();
    if (body.contactEmail !== undefined) updateData.contactEmail = String(body.contactEmail).trim();
    if (body.contactPhone !== undefined) updateData.contactPhone = String(body.contactPhone).trim();
    if (body.gstinTaxId !== undefined) updateData.gstinTaxId = String(body.gstinTaxId).trim().toUpperCase();
    if (body.currencySymbol !== undefined) updateData.currencySymbol = String(body.currencySymbol).trim();
    if (body.bannerMessage !== undefined) updateData.bannerMessage = String(body.bannerMessage).trim();

    if (body.codDeliveryCharge !== undefined) {
      const codVal = Number(body.codDeliveryCharge);
      if (isNaN(codVal) || codVal < 0) {
        return NextResponse.json({ error: 'COD Delivery Charge must be a non-negative number' }, { status: 400 });
      }
      updateData.codDeliveryCharge = codVal;
    }

    if (body.freeShippingThreshold !== undefined) {
      const freeShipVal = Number(body.freeShippingThreshold);
      if (!isNaN(freeShipVal) && freeShipVal >= 0) {
        updateData.freeShippingThreshold = freeShipVal;
      }
    }

    if (body.referralRewardCredit !== undefined) {
      const refVal = Number(body.referralRewardCredit);
      if (!isNaN(refVal) && refVal >= 0) {
        updateData.referralRewardCredit = refVal;
      }
    }

    if (body.friendFirstOrderDiscountPercent !== undefined) {
      const discVal = Number(body.friendFirstOrderDiscountPercent);
      if (!isNaN(discVal) && discVal >= 0 && discVal <= 100) {
        updateData.friendFirstOrderDiscountPercent = discVal;
      }
    }

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(updateData);
    } else {
      Object.assign(settings, updateData);
    }

    await settings.save();
    await invalidateCache('store:settings');

    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to save settings' }, { status: 500 });
  }
}
