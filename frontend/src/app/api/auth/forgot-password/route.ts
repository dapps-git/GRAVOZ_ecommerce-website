import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(to: string, name: string, otp: string): Promise<void> {
  const smtpEmail = process.env.SMTP_EMAIL || 'gravozshoes@gmail.com';
  const smtpPassword = process.env.SMTP_PASSWORD || 'lhamhtgfhhspazkh';
  const fromName = process.env.SMTP_FROM_NAME || 'GRAVOZ Store';
  const appUrl = 'https://gravoz-ecommerce-website.vercel.app';
  
  const logoPath = path.join(process.cwd(), 'public', 'gravoz-logo.png');
  const hasLocalLogo = fs.existsSync(logoPath);
  const logoSrc = hasLocalLogo ? 'cid:gravoz-logo' : `${appUrl}/gravoz-logo.png`;

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
    subject: `Your GRAVOZ Password Reset Code: ${otp}`,
    attachments: hasLocalLogo
      ? [
          {
            filename: 'gravoz-logo.png',
            path: logoPath,
            cid: 'gravoz-logo',
          },
        ]
      : [],
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body, table, td, p, h1, h2, h3, span {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-weight: 300;
          }
          strong, b { font-weight: 600; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f5f0; color: #1a1a1a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f5f0; width: 100%; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; width: 100%; background-color: #ffffff; border: 1px solid #e8decb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                
                <!-- Brand Header with Official Logo -->
                <tr>
                  <td style="background-color: #ffffff; padding: 26px 28px 20px 28px; text-align: center; border-bottom: 1px solid #ebdccb;">
                    <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img 
                        src="${logoSrc}" 
                        alt="GRAVOZ" 
                        width="150" 
                        style="display: block; width: 150px; max-width: 100%; height: auto; margin: 0 auto; border: 0;"
                      />
                    </a>
                    <p style="margin: 6px 0 0 0; color: #89591C; font-size: 10.5px; font-weight: 400; letter-spacing: 0.18em; text-transform: uppercase;">
                      Security Verification
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px 28px 24px 28px;">
                    <h2 style="margin: 0 0 10px 0; color: #111111; font-size: 20px; font-weight: 500; letter-spacing: -0.01em;">
                      Password Reset Request
                    </h2>
                    <p style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.6; color: #555555; font-weight: 300;">
                      Hi ${name || 'there'}, we received a request to reset your password. Use the single-use verification code below to proceed:
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #faf6ef; border: 1.5px solid #ebdccb; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 22px;">
                      <span style="font-family: 'Montserrat', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #89591C; display: inline-block; padding-left: 10px;">
                        ${otp}
                      </span>
                    </div>

                    <p style="margin: 0 0 8px 0; color: #777777; font-size: 11.5px; font-weight: 400;">
                      ⏱ This code is valid for <strong>10 minutes</strong>.
                    </p>
                    <p style="margin: 0; color: #999999; font-size: 11px; font-weight: 300;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #faf7f2; padding: 18px 28px; text-align: center; border-top: 1px solid #ebdccb;">
                    <p style="margin: 0; font-size: 10.5px; color: #999999; font-weight: 300;">
                      © ${new Date().getFullYear()} GRAVOZ Footwear. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
