import HomePageClient from '@/app/HomePageClient';
import SponsoredAd from '@/components/SponsoredAd';
import { fetchPublicJson } from '@/lib/serverApi';

export default async function HomePage() {
  const [productsData, sponsoredData, blogData] = await Promise.all([
    fetchPublicJson('/api/products?limit=60&status=approved', { products: [] }),
    fetchPublicJson('/api/products/sponsored', { products: [] }),
    fetchPublicJson('/api/blog?limit=3', { posts: [] }),
  ]);

  const sponsoredProducts = Array.isArray(sponsoredData?.products) ? sponsoredData.products : [];

  return (
    <>
    <SponsoredAd products={sponsoredProducts} />
    <HomePageClient
      initialProducts={Array.isArray(productsData?.products) ? productsData.products : []}
      initialSponsoredProducts={sponsoredProducts}
      initialBlogPosts={Array.isArray(blogData?.posts) ? blogData.posts : []}
    />
    </>
  );
}
