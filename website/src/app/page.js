import HomePageClient from '@/app/HomePageClient';
import { fetchPublicJson } from '@/lib/serverApi';

export default async function HomePage() {
  const [productsData, sponsoredData, blogData] = await Promise.all([
    fetchPublicJson('/api/products?limit=24&status=approved', { products: [] }, { next: { revalidate: 60 } }),
    fetchPublicJson('/api/products/sponsored', { products: [] }, { next: { revalidate: 60 } }),
    fetchPublicJson('/api/blog?limit=3', { posts: [] }, { next: { revalidate: 60 } }),
  ]);

  return (
    <HomePageClient
      initialProducts={Array.isArray(productsData?.products) ? productsData.products : []}
      initialSponsoredProducts={Array.isArray(sponsoredData?.products) ? sponsoredData.products : []}
      initialBlogPosts={Array.isArray(blogData?.posts) ? blogData.posts : []}
    />
  );
}
