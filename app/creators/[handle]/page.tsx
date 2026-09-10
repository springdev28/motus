import { MotusCreators } from '@/components/motus-platform-pages';
export default async function Page({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return <MotusCreators handle={handle} />;
}
