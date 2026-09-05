import { CorreoFolderView } from '@/components/admin/CorreoFolderView';

export default async function AdminCorreoFolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CorreoFolderView folderId={id} />;
}
