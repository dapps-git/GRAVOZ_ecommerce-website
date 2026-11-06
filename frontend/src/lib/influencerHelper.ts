import mongoose from 'mongoose';
import { Influencer } from '@/models/Influencer';

export interface InfluencerIdentifier {
  influencerId?: string;
  influencerName?: string;
  affiliateCode?: string;
}

/**
 * Validates and retrieves an active influencer by ObjectId, affiliate code, or name.
 */
export async function findActiveInfluencer(identifier?: InfluencerIdentifier | null) {
  if (!identifier) return null;

  const { influencerId, affiliateCode, influencerName } = identifier;

  // 1. If valid ObjectId provided (primary source of truth)
  if (influencerId && typeof influencerId === 'string' && mongoose.Types.ObjectId.isValid(influencerId.trim())) {
    try {
      const inf = await Influencer.findOne({
        _id: new mongoose.Types.ObjectId(influencerId.trim()),
        status: 'active',
      });
      if (inf) return inf;
    } catch {
      // ignore
    }
  }

  // 2. If affiliate code provided (e.g. ?ref=AISHA or ?influencerCode=AISHA)
  if (affiliateCode && typeof affiliateCode === 'string') {
    try {
      const inf = await Influencer.findOne({
        affiliateCode: affiliateCode.trim().toUpperCase(),
        status: 'active',
      });
      if (inf) return inf;
    } catch {
      // ignore
    }
  }

  // 3. Fallback to name search if influencer name matches active influencer
  if (influencerName && typeof influencerName === 'string' && influencerName.trim().length > 1) {
    try {
      const inf = await Influencer.findOne({
        name: new RegExp(`^${influencerName.trim()}$`, 'i'),
        status: 'active',
      });
      if (inf) return inf;
    } catch {
      // ignore
    }
  }

  return null;
}

