import { shareDocument } from '@/lib/productShare.cjs';

export const dynamic = 'force-dynamic';
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');

export async function GET(request, { params }) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(params.id)) return new Response('Product not found', { status: 404 });
  try {
    const response = await fetch(`${API_URL}/api/products/${encodeURIComponent(params.id)}`, {
      cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) return new Response('Product not found', { status: 404 });
    if (!response.ok) throw new Error('Product service unavailable');
    const data = await response.json();
    if (!data.product) return new Response('Product not found', { status: 404 });
    return new Response(shareDocument(data.product), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch {
    return new Response('Product temporarily unavailable. Please try again.', { status: 503 });
  }
}
