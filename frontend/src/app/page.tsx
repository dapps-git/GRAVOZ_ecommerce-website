import HomeClient from '@/components/HomeClient';
import { getStorefrontHomeData } from '@/lib/storefront-data';

export const revalidate = 30;

export default async function StorefrontHomePage() {
  const initialData = await getStorefrontHomeData();
  return <HomeClient initialData={initialData} />;
}
