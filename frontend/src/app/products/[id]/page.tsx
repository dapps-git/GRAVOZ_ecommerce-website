import ProductDetailClient from '@/components/ProductDetailClient';
import { getProductDetailData } from '@/lib/storefront-data';

export const revalidate = 30;

export default async function ProductInnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialData = await getProductDetailData(id);

  return (
    <ProductDetailClient
      key={id}
      initialProduct={initialData.product}
      initialReviews={initialData.reviews}
      initialAvgRating={initialData.avgRating}
      initialAddons={initialData.addons}
      hasServerData={initialData.hasServerData}
    />
  );
}
