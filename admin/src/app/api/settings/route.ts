import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Setting } from '@/models/Setting';
import { getCache, setCache, invalidateCache } from '@/lib/redis';

// GET /api/settings
export async function GET() {
  try {
    const cacheKey = 'store:settings';
    const cached = await getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    await connectDB();
    let settings = await Setting.findOne().lean();
    if (!settings) {
      await Setting.create({});
      settings = await Setting.findOne().lean();
    }

    await setCache(cacheKey, settings, 3600);
    return NextResponse.json(settings);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(body);
    } else {
      Object.assign(settings, body);
    }

    await settings.save();
    await invalidateCache('store:settings');

    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to save settings' }, { status: 500 });
  }
}
