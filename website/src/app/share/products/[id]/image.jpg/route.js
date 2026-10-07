import { productUploadPath } from '@/lib/productShare.cjs';

export const dynamic = 'force-dynamic';
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');

export async function GET(request, { params }) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(params.id)) return new Response('Product not found', { status: 404 });
  try {
    const productResponse = await fetch(`${API_URL}/api/products/${encodeURIComponent(params.id)}`, {
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (productResponse.status === 404) return new Response('Product not found', { status: 404 });
    if (!productResponse.ok) throw new Error('Product service unavailable');
    const { product } = await productResponse.json();
    const src = product && productUploadPath(product);
    if (!src) return new Response('Product image not found', { status: 404 });
    const imageResponse = await fetch(`${API_URL}/api/image?${new URLSearchParams({ src, fit: 'social' })}`, {
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (imageResponse.status === 404) return new Response('Product image not found', { status: 404 });
    if (!imageResponse.ok) throw new Error('Preview unavailable');
    const buffer = await imageResponse.arrayBuffer();
    return new Response(buffer, { headers: {
      'Content-Type': 'image/jpeg', 'Content-Length': String(buffer.byteLength),
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'ETag': imageResponse.headers.get('etag') || '',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch {
    return new Response('Preview temporarily unavailable', { status: 503 });
  }
}
