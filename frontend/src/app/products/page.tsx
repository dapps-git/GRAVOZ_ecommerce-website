import { Suspense } from 'react';
import ProductsClient from '@/components/ProductsClient';
import { getStorefrontProductsData } from '@/lib/storefront-data';

export const revalidate = 30;

export default async function ProductsPage() {
  const { products, categories, brands, hasServerData } = await getStorefrontProductsData();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-xs font-semibold text-[#F37021]">
          Loading Footwear Collection...
        </div>
      }
    >
      <ProductsClient
        initialProducts={products}
        initialCategories={categories}
        initialBrands={brands}
        hasServerData={hasServerData}
      />
    </Suspense>
  );
}
