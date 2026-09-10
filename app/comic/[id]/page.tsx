import { MotusComic } from '@/components/motus-platform-pages';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MotusComic id={id} />;
}
