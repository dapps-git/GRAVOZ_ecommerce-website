import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Influencer } from '@/models/Influencer';
import { Customer } from '@/models/Customer';
import { Order } from '@/models/Order';
import { AffiliateCommission } from '@/models/AffiliateCommission';
import { requireAdmin } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

function getBaseWebsiteUrl(req?: NextRequest): string {
  if (process.env.NEXT_PUBLIC_STORE_URL) {
    return process.env.NEXT_PUBLIC_STORE_URL.replace(/\/+$/, '');
  }
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.replace(/\/+$/, '');
  }
  if (process.env.STORE_URL) {
    return process.env.STORE_URL.replace(/\/+$/, '');
  }
  return 'https://www.gravoz.com';
}

function buildAffiliateUrl(baseUrl: string, influencer: { name: string; _id: any; affiliateCode?: string }): string {
  return `${baseUrl}/login?influencer=${encodeURIComponent(influencer.name)}&influencerId=${influencer._id.toString()}`;
}

// GET /api/admin/affiliates - List all influencers with live metrics
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    await connectDB();
    const baseUrl = getBaseWebsiteUrl(req);

    const influencers = await Influencer.find().sort({ createdAt: -1 }).lean();

    // Fetch all customers associated with any influencer
    const customers = await Customer.find({
      influencerId: { $ne: null },
    })
      .select('_id influencerId')
      .lean();

    // Group customer count by influencerId
    const customerCountMap = new Map<string, number>();
    customers.forEach((c: any) => {
      if (c.influencerId) {
        const key = String(c.influencerId);
        customerCountMap.set(key, (customerCountMap.get(key) || 0) + 1);
      }
    });

    // Fetch all orders associated with any influencer
    const orders = await Order.find({
      influencerId: { $ne: null },
      orderStatus: { $ne: 'cancelled' },
    })
      .select('_id influencerId totalAmount')
      .lean();

    // Group order count and sales by influencerId
    const orderCountMap = new Map<string, number>();
    const orderSalesMap = new Map<string, number>();
    orders.forEach((o: any) => {
      if (o.influencerId) {
        const key = String(o.influencerId);
        orderCountMap.set(key, (orderCountMap.get(key) || 0) + 1);
        orderSalesMap.set(key, (orderSalesMap.get(key) || 0) + (Number(o.totalAmount) || 0));
      }
    });

    // Fetch all commissions
    const commissions = await AffiliateCommission.find().lean();
    const pendingCommMap = new Map<string, number>();
    const approvedCommMap = new Map<string, number>();
    const paidCommMap = new Map<string, number>();

    commissions.forEach((comm: any) => {
      if (comm.influencerId) {
        const key = String(comm.influencerId);
        const amt = Number(comm.commissionAmount) || 0;
        if (comm.status === 'pending') {
          pendingCommMap.set(key, (pendingCommMap.get(key) || 0) + amt);
        } else if (comm.status === 'approved') {
          approvedCommMap.set(key, (approvedCommMap.get(key) || 0) + amt);
        } else if (comm.status === 'paid') {
          paidCommMap.set(key, (paidCommMap.get(key) || 0) + amt);
        }
      }
    });

    // Aggregate overall metrics
    let totalAffiliateSales = 0;
    let totalPendingCommission = 0;
    let totalApprovedCommission = 0;
    let totalPaidCommission = 0;

    const formattedInfluencers = influencers.map((inf: any) => {
      const idStr = String(inf._id);
      const totalCust = customerCountMap.get(idStr) || 0;
      const totalOrd = orderCountMap.get(idStr) || 0;
      const totalSal = Math.round((orderSalesMap.get(idStr) || 0) * 100) / 100;
      const pending = Math.round((pendingCommMap.get(idStr) || 0) * 100) / 100;
      const approved = Math.round((approvedCommMap.get(idStr) || 0) * 100) / 100;
      const paid = Math.round((paidCommMap.get(idStr) || 0) * 100) / 100;

      totalAffiliateSales += totalSal;
      totalPendingCommission += pending;
      totalApprovedCommission += approved;
      totalPaidCommission += paid;

      return {
        _id: idStr,
        name: inf.name,
        affiliateCode: inf.affiliateCode,
        affiliateLink: buildAffiliateUrl(baseUrl, inf),
        email: inf.email || '',
        phone: inf.phone || '',
        commissionType: inf.commissionType || 'percentage',
        commissionValue: inf.commissionValue ?? 5,
        status: inf.status || 'active',
        notes: inf.notes || '',
        createdAt: inf.createdAt,
        totalCustomers: totalCust,
        totalOrders: totalOrd,
        totalSales: totalSal,
        pendingCommission: pending,
        approvedCommission: approved,
        paidCommission: paid,
      };
    });

    return NextResponse.json({
      success: true,
      influencers: formattedInfluencers,
      stats: {
        totalInfluencers: influencers.length,
        totalAffiliateCustomers: customers.length,
        totalAffiliateOrders: orders.length,
        totalAffiliateSales: Math.round(totalAffiliateSales * 100) / 100,
        totalPendingCommission: Math.round(totalPendingCommission * 100) / 100,
        totalApprovedCommission: Math.round(totalApprovedCommission * 100) / 100,
        totalPaidCommission: Math.round(totalPaidCommission * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('Fetch affiliates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch influencers' },
      { status: 500 }
    );
  }
}

// POST /api/admin/affiliates - Create a new Influencer and generate affiliate link
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    await connectDB();
    const body = await req.json();
    const { name, affiliateCode, commissionType, commissionValue, email, phone, status, notes } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Influencer name is required' }, { status: 400 });
    }

    const cleanName = name.trim();

    // Auto-generate unique affiliateCode if not provided
    let finalCode = (affiliateCode || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!finalCode) {
      const namePrefix = cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'INF';
      const randNum = Math.floor(100 + Math.random() * 900);
      finalCode = `${namePrefix}${randNum}`;
    }

    // Verify uniqueness of affiliateCode
    const existingCode = await Influencer.findOne({ affiliateCode: finalCode });
    if (existingCode) {
      return NextResponse.json(
        { error: `Affiliate code "${finalCode}" is already taken. Please choose another code.` },
        { status: 409 }
      );
    }

    const type = commissionType === 'fixed' ? 'fixed' : 'percentage';
    const numValue = typeof commissionValue === 'number' && !isNaN(commissionValue) && commissionValue >= 0
      ? commissionValue
      : 5;

    const influencer = await Influencer.create({
      name: cleanName,
      affiliateCode: finalCode,
      email: (email || '').toLowerCase().trim(),
      phone: (phone || '').trim(),
      commissionType: type,
      commissionValue: numValue,
      status: status === 'inactive' ? 'inactive' : 'active',
      notes: (notes || '').trim(),
    });

    const baseUrl = getBaseWebsiteUrl(req);
    const affiliateLink = buildAffiliateUrl(baseUrl, influencer);

    return NextResponse.json(
      {
        success: true,
        message: 'Influencer created successfully',
        influencer: {
          _id: influencer._id.toString(),
          name: influencer.name,
          affiliateCode: influencer.affiliateCode,
          affiliateLink,
          commissionType: influencer.commissionType,
          commissionValue: influencer.commissionValue,
          status: influencer.status,
          email: influencer.email,
          phone: influencer.phone,
          notes: influencer.notes,
          createdAt: influencer.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create influencer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create influencer' },
      { status: 500 }
    );
  }
}

