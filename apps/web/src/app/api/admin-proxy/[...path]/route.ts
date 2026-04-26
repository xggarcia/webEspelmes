import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const jar = await cookies();
  const session = jar.get('admin_session')?.value;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken || session !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await params;
  const targetUrl = `${API_BASE}/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set('x-admin-token', adminToken);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.blob()
    : undefined;

  const res = await fetch(targetUrl, { method: req.method, headers, body });

  const resHeaders = new Headers();
  const resContentType = res.headers.get('content-type');
  if (resContentType) resHeaders.set('content-type', resContentType);

  const resBody = res.status === 204 ? null : await res.blob();
  return new NextResponse(resBody, { status: res.status, headers: resHeaders });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
