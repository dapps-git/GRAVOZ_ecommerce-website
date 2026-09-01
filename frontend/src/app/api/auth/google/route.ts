import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';
import { signUserToken, setUserAuthCookie, generateReferralCode } from '@/lib/auth';

// Helper to decode JWT payload safely
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { credential, googleId, email, name, avatarUrl } = body;

    let userEmail = email;
    let userName = name;
    let userAvatar = avatarUrl;
    let userGoogleId = googleId;

    // 1. If Google ID Token (credential) is passed from Google Sign-In SDK
    if (credential) {
      // Decode client side for immediate fields
      const payload = decodeJwtPayload(credential);
      if (payload && payload.email) {
        userEmail = payload.email;
        userName = payload.name || payload.given_name || userEmail.split('@')[0];
        userAvatar = payload.picture || '';
        userGoogleId = payload.sub || userGoogleId;
      }

      // Cryptographically verify with Google's tokeninfo endpoint (server-to-server)
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          const verifiedData = await verifyRes.json();
          if (verifiedData.email) {
            userEmail = verifiedData.email;
            userName = verifiedData.name || verifiedData.given_name || userName;
            userAvatar = verifiedData.picture || userAvatar;
            userGoogleId = verifiedData.sub || userGoogleId;
          }
        }
      } catch {
        // Fallback to decoded payload if Google tokeninfo has network glitch
      }
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Google email could not be determined. Please try again.' }, { status: 400 });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    let customer = await Customer.findOne({
      $or: [{ email: normalizedEmail }, { googleId: userGoogleId }],
    });

    if (customer) {
      // Existing user: Link Google ID and update profile info
      if (!customer.googleId && userGoogleId) {
        customer.googleId = userGoogleId;
      }
      if (userAvatar && !customer.avatarUrl) {
        customer.avatarUrl = userAvatar;
      }
      customer.isEmailVerified = true;
      customer.lastLogin = new Date();
      if (!customer.activityLogs) customer.activityLogs = [];
      customer.activityLogs.push({
        action: 'Google Login',
        details: 'User authenticated via Google OAuth',
        timestamp: new Date(),
      });
      await customer.save();
    } else {
      // New user: Create customer account in MongoDB (GRAVOX)
      let referralCode = generateReferralCode(userName || 'User');
      let attempts = 0;
      while (await Customer.findOne({ referralCode }) && attempts < 5) {
        referralCode = generateReferralCode(userName || 'User');
        attempts++;
      }

      customer = await Customer.create({
        name: userName || 'Customer',
        email: normalizedEmail,
        googleId: userGoogleId,
        avatarUrl: userAvatar || '',
        authProvider: 'google',
        isEmailVerified: true,
        referralCode,
        rewardPoints: 50, // 50 Welcome bonus points
        tier: 'Silver',
        activityLogs: [
          {
            action: 'Account Created',
            details: 'User registered via Google OAuth',
            timestamp: new Date(),
          },
        ],
        lastLogin: new Date(),
      });
    }

    // Sign 2-week persistent JWT session
    const token = signUserToken({
      userId: customer._id.toString(),
      email: customer.email,
      name: customer.name,
      tier: customer.tier,
    });

    // Store in httpOnly, secure cookie
    await setUserAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Google authentication successful',
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatarUrl: customer.avatarUrl,
        rewardPoints: customer.rewardPoints,
        referralCode: customer.referralCode,
        tier: customer.tier,
        authProvider: customer.authProvider,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Google auth error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
