import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(to: string, name: string, otp: string): Promise<void> {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const fromName = process.env.SMTP_FROM_NAME || 'GRAVOX Store';

  if (!smtpEmail || !smtpPassword) {
    // No SMTP configured — log OTP to console for development
    console.log(`\n========================================`);
    console.log(`🔑 OTP for ${to}: ${otp}`);
    console.log(`========================================\n`);
    return;
  }

  // Dynamically import nodemailer (server-side only)
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  await transporter.sendMail({
    from: `"${fromName}" <${smtpEmail}>`,
    to,
    subject: `Your GRAVOX Password Reset OTP: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff; border: 1px solid #e8e2d8;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #89591C; font-size: 22px; margin: 0;">GRAVOX</h2>
          <p style="color: #666; font-size: 12px; margin: 4px 0 0;">PREMIUM HANDCRAFTED FOOTWEAR</p>
        </div>
        <h3 style="color: #1a1a1a; font-size: 18px; margin: 0 0 8px;">Password Reset OTP</h3>
        <p style="color: #555; font-size: 14px; margin: 0 0 24px;">Hi ${name}, here is your one-time password to reset your account:</p>
        <div style="background: #faf4ec; border: 2px solid #89591C; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #89591C;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 12px; margin: 0 0 8px;">⏱ This OTP expires in <strong>10 minutes</strong>.</p>
        <p style="color: #888; font-size: 12px; margin: 0;">If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e8e2d8; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 11px; text-align: center; margin: 0;">© ${new Date().getFullYear()} GRAVOX. All rights reserved.</p>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const customer = await Customer.findOne({ email: normalizedEmail });

    // For security — always respond the same way whether user exists or not
    if (!customer) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent.',
      });
    }

    // Check if user already has an active, unexpired OTP (reuse same OTP if requested again)
    const isOtpValid = !!customer.otpCode && !!customer.otpExpires && new Date(customer.otpExpires) > new Date();
    const otp: string = isOtpValid && customer.otpCode ? customer.otpCode : generateOTP();

    // Refresh expiration for 10 minutes
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    customer.otpCode = otp;
    customer.otpExpires = otpExpires;
    if (!customer.activityLogs) customer.activityLogs = [];
    customer.activityLogs.push({
      action: 'Password Reset OTP Sent',
      details: `OTP generated for password reset`,
      timestamp: new Date(),
    });
    await customer.save();

    await sendOTPEmail(normalizedEmail, customer.name, otp);

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address. Please check your inbox.',
      // In dev: also return OTP if no SMTP configured
      ...((!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) && { devOtp: otp }),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
