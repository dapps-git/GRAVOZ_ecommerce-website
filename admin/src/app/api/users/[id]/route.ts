import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const body = await req.json();

    const customer = await Customer.findById(resolvedParams.id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (typeof body.isActive === 'boolean') {
      customer.isActive = body.isActive;
    }

    if (body.tier && ['Silver', 'Gold', 'Platinum'].includes(body.tier)) {
      customer.tier = body.tier;
    }

    if (body.rewardPoints !== undefined) {
      customer.rewardPoints = Number(body.rewardPoints);
    }

    if (!customer.activityLogs) customer.activityLogs = [];
    customer.activityLogs.push({
      action: 'Admin Update',
      details: `Account status updated by Admin: ${customer.isActive ? 'Active' : 'Deactivated'}`,
      timestamp: new Date(),
    });

    await customer.save();

    return NextResponse.json({
      success: true,
      message: `Customer ${customer.isActive ? 'activated' : 'deactivated'} successfully`,
      customer,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;

    const customer = await Customer.findByIdAndDelete(resolvedParams.id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete customer' }, { status: 500 });
  }
}
