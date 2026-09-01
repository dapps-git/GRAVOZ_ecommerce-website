import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const customer = await Customer.findOne({ email: normalizedEmail });

    if (!customer) {
      return NextResponse.json({ error: 'Invalid OTP or email' }, { status: 400 });
    }

    // Check OTP matches and is not expired
    if (!customer.otpCode || customer.otpCode !== otp.toString().trim()) {
      return NextResponse.json({ error: 'Invalid OTP. Please check and try again.' }, { status: 400 });
    }

    if (!customer.otpExpires || customer.otpExpires < new Date()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Update password and clear OTP
    customer.passwordHash = await hashPassword(newPassword);
    customer.otpCode = undefined;
    customer.otpExpires = undefined;
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpires = undefined;

    if (!customer.activityLogs) customer.activityLogs = [];
    customer.activityLogs.push({
      action: 'Password Reset',
      details: 'Password successfully reset via OTP',
      timestamp: new Date(),
    });

    await customer.save();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now log in.',
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Reset password error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
