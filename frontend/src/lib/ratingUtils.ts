/**
 * Helper to generate consistent, realistic ratings and review counts for products.
 * Yields values like 4.6, 4.8, 4.5, 4.7, 4.9 and realistic counts like 128, 94, 142.
 */
export function getProductRating(product: {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  rating?: number;
  reviewsCount?: number;
}): { rating: number; reviewsCount: number } {
  const seedStr = (product?._id || product?.id || product?.name || product?.title || 'gravoz') + '';
  
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  // If the product already has a custom decimal rating (e.g. 4.6), keep it
  let rating = product?.rating;
  if (!rating || rating === 5 || rating === 0) {
    const ratingsPool = [4.5, 4.6, 4.7, 4.8, 4.9, 4.6, 4.7, 4.8];
    rating = ratingsPool[posHash % ratingsPool.length];
  }

  let reviewsCount = product?.reviewsCount;
  if (!reviewsCount || reviewsCount === 0 || reviewsCount === 120) {
    const countsPool = [94, 112, 128, 146, 88, 164, 135, 152, 98, 175];
    reviewsCount = countsPool[posHash % countsPool.length];
  }

  return { rating, reviewsCount };
}
