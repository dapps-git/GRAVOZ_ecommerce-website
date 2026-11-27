import ProductDetailClient from '@/components/ProductDetailClient';
import { getAllActiveProductRouteParams, getProductDetailData } from '@/lib/storefront-data';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const ids = await getAllActiveProductRouteParams();
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

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
