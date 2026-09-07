import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';
import { getUserSession, comparePassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to update password.' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    const customer = await Customer.findById(session.userId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer account not found' }, { status: 404 });
    }

    if (!customer.passwordHash) {
      return NextResponse.json(
        { error: 'This account was created with Google OAuth. Password cannot be updated directly.' },
        { status: 400 }
      );
    }

    const isMatch = await comparePassword(currentPassword, customer.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    customer.passwordHash = await hashPassword(newPassword);
    if (!customer.activityLogs) customer.activityLogs = [];
    customer.activityLogs.push({
      action: 'Password Changed',
      details: 'User changed password via account security settings',
      timestamp: new Date(),
    });
    await customer.save();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update password error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
