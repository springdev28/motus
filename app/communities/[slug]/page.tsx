import { MotusCommunities } from '@/components/motus-platform-pages';
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MotusCommunities slug={slug} />;
}
