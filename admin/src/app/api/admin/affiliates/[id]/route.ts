import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Influencer } from '@/models/Influencer';
import { Customer } from '@/models/Customer';
import { Order } from '@/models/Order';
import { AffiliateCommission } from '@/models/AffiliateCommission';
import { requireAdmin } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

function getBaseWebsiteUrl(req?: NextRequest): string {
  const storeUrl =
    process.env.NEXT_PUBLIC_STORE_URL ||
    process.env.CLIENT_URL ||
    process.env.STORE_URL ||
    'https://www.searcherstore.com';

  const clean = storeUrl.replace(/\/+$/, '');
  // Automatically replace legacy gravoz.com domain with searcherstore.com
  if (clean.includes('gravoz.com')) {
    return clean.replace(/gravoz\.com/g, 'searcherstore.com');
  }
  return clean;
}

function buildAffiliateUrl(baseUrl: string, influencer: { name: string; _id: any }): string {
  return `${baseUrl}/login?influencer=${encodeURIComponent(influencer.name)}&influencerId=${influencer._id.toString()}`;
}

// GET /api/admin/affiliates/[id] - Influencer details with all associated customers and orders
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await props.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid influencer ID' }, { status: 400 });
    }

    await connectDB();
    const baseUrl = getBaseWebsiteUrl(req);

    const influencer = await Influencer.findById(id).lean();
    if (!influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    // 1. Fetch all customers associated with this influencer
    const customers = await Customer.find({ influencerId: influencer._id })
      .select('name email phone createdAt totalOrders totalSpent tier influencerAssignedAt')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch all orders with this influencerId
    const orders = await Order.find({ influencerId: influencer._id })
      .select('orderNumber customerName customerEmail totalAmount subtotal discountAmount referralDiscountAmount shippingFee paymentStatus orderStatus paymentMethod commissionAmount commissionRate commissionType commissionStatus createdAt items')
      .sort({ createdAt: -1 })
      .lean();

    // 3. Fetch all commission records for this influencer
    const commissions = await AffiliateCommission.find({ influencerId: influencer._id })
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate metrics
    let totalSales = 0;
    let pendingCommission = 0;
    let approvedCommission = 0;
    let paidCommission = 0;

    orders.forEach((o: any) => {
      if (o.orderStatus !== 'cancelled') {
        totalSales += Number(o.totalAmount) || 0;
      }
    });

    commissions.forEach((c: any) => {
      const amt = Number(c.commissionAmount) || 0;
      if (c.status === 'pending') pendingCommission += amt;
      else if (c.status === 'approved') approvedCommission += amt;
      else if (c.status === 'paid') paidCommission += amt;
    });

    return NextResponse.json({
      success: true,
      influencer: {
        _id: influencer._id.toString(),
        name: influencer.name,
        affiliateCode: influencer.affiliateCode,
        affiliateLink: buildAffiliateUrl(baseUrl, influencer),
        email: influencer.email || '',
        phone: influencer.phone || '',
        commissionType: influencer.commissionType || 'percentage',
        commissionValue: influencer.commissionValue ?? 5,
        status: influencer.status || 'active',
        notes: influencer.notes || '',
        createdAt: influencer.createdAt,
      },
      stats: {
        totalCustomers: customers.length,
        totalOrders: orders.length,
        totalSales: Math.round(totalSales * 100) / 100,
        pendingCommission: Math.round(pendingCommission * 100) / 100,
        approvedCommission: Math.round(approvedCommission * 100) / 100,
        paidCommission: Math.round(paidCommission * 100) / 100,
      },
      customers,
      orders,
      commissions,
    });
  } catch (error: any) {
    console.error('Fetch influencer details error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch influencer' }, { status: 500 });
  }
}

// PUT /api/admin/affiliates/[id] - Update influencer details
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await props.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid influencer ID' }, { status: 400 });
    }

    await connectDB();
    const body = await req.json();
    const { name, affiliateCode, commissionType, commissionValue, email, phone, status, notes } = body;

    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    if (name && typeof name === 'string') influencer.name = name.trim();
    if (email !== undefined) influencer.email = String(email).toLowerCase().trim();
    if (phone !== undefined) influencer.phone = String(phone).trim();
    if (notes !== undefined) influencer.notes = String(notes).trim();
    if (status === 'active' || status === 'inactive') influencer.status = status;
    if (commissionType === 'percentage' || commissionType === 'fixed') influencer.commissionType = commissionType;
    if (typeof commissionValue === 'number' && commissionValue >= 0) influencer.commissionValue = commissionValue;

    if (affiliateCode) {
      const cleanCode = String(affiliateCode).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanCode && cleanCode !== influencer.affiliateCode) {
        const existing = await Influencer.findOne({ affiliateCode: cleanCode, _id: { $ne: influencer._id } });
        if (existing) {
          return NextResponse.json({ error: `Affiliate code "${cleanCode}" is already in use.` }, { status: 409 });
        }
        influencer.affiliateCode = cleanCode;
      }
    }

    await influencer.save();

    const baseUrl = getBaseWebsiteUrl(req);
    return NextResponse.json({
      success: true,
      message: 'Influencer updated successfully',
      influencer: {
        _id: influencer._id.toString(),
        name: influencer.name,
        affiliateCode: influencer.affiliateCode,
        affiliateLink: buildAffiliateUrl(baseUrl, influencer),
        commissionType: influencer.commissionType,
        commissionValue: influencer.commissionValue,
        status: influencer.status,
        email: influencer.email,
        phone: influencer.phone,
        notes: influencer.notes,
      },
    });
  } catch (error: any) {
    console.error('Update influencer error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update influencer' }, { status: 500 });
  }
}

// DELETE /api/admin/affiliates/[id] - Delete or archive influencer
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await props.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid influencer ID' }, { status: 400 });
    }

    await connectDB();
    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    // Soft delete: switch status to inactive if there are associated orders or customers
    const orderCount = await Order.countDocuments({ influencerId: influencer._id });
    const customerCount = await Customer.countDocuments({ influencerId: influencer._id });

    if (orderCount > 0 || customerCount > 0) {
      influencer.status = 'inactive';
      await influencer.save();
      return NextResponse.json({
        success: true,
        message: 'Influencer has associated orders/customers. Status changed to inactive.',
      });
    }

    await Influencer.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Influencer deleted successfully' });
  } catch (error: any) {
    console.error('Delete influencer error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete influencer' }, { status: 500 });
  }
}

