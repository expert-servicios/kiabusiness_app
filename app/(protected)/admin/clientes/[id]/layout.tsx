import type { ReactNode } from 'react';
import { ClientCommunicationsShortcut } from './ClientCommunicationsShortcut';

export default async function ClientLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      {children}
      <ClientCommunicationsShortcut clientId={id} />
    </>
  );
}
