import { fetchPublicJson } from '@/lib/serverApi';
import { productImage } from '@/lib/productShare.cjs';

export async function generateMetadata({ params }) {
  const data = await fetchPublicJson(`/api/products/${params.id}`, null);
  const product = data?.product;
  if (!product) return { title: 'Product | Sawdagar' };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sawdagar.com').replace(/\/$/, '');
  const image = productImage(product);
  const title = `${product.nameEn} | Sawdagar`;
  const description = product.descEn || `Buy ${product.nameEn} from ${product.supplier?.companyName || 'Sawdagar'}.`;

  return {
    title,
    description,
    openGraph: { title, description, url: `${siteUrl}/products/${product.id}`, type: 'website', images: [{ url: image, alt: product.nameEn }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default function ProductLayout({ children }) {
  return children;
}
