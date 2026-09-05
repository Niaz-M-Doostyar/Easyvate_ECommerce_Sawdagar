import HomePageClient from '@/app/HomePageClient';
import { fetchPublicJson } from '@/lib/serverApi';

export default async function HomePage() {
  const [productsData, sponsoredData, blogData] = await Promise.all([
    fetchPublicJson('/api/products?limit=50&status=approved', { products: [] }),
    fetchPublicJson('/api/products/sponsored', { products: [] }),
    fetchPublicJson('/api/blog?limit=3', { posts: [] }),
  ]);

  return (
    <HomePageClient
      initialProducts={Array.isArray(productsData?.products) ? productsData.products : []}
      initialSponsoredProducts={Array.isArray(sponsoredData?.products) ? sponsoredData.products : []}
      initialBlogPosts={Array.isArray(blogData?.posts) ? blogData.posts : []}
    />
  );
}
