import { publicPlatformConfig } from '@/lib/motus-platform-config';
export function GET() {
  return Response.json(
    publicPlatformConfig(
      process.env.MOTUS_SUPABASE_URL,
      process.env.MOTUS_SUPABASE_PUBLISHABLE_KEY,
      process.env.MOTUS_AUTH_EMAIL_READY === 'true',
    ),
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
