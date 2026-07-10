import { NextResponse } from 'next/server';
import { buildBlogRss } from '@/lib/marketing/rss';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function GET() {
  return new NextResponse(buildBlogRss(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
