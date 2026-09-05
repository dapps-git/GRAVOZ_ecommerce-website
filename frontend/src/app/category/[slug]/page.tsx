import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const lower = (slug || '').toLowerCase();

  if (lower === 'men' || lower === 'women' || lower === 'kids' || lower === 'babies') {
    const audienceName = lower === 'kids' ? 'Kids' : lower.charAt(0).toUpperCase() + lower.slice(1);
    redirect(`/products?audience=${audienceName}`);
  }

  redirect(`/products?category=${encodeURIComponent(slug)}`);
}
