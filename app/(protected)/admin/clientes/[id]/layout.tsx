import type { ReactNode } from 'react';
import { ClientCommunicationsShortcut } from './ClientCommunicationsShortcut';
import { Client360ContextBar } from './Client360ContextBar';

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
      <Client360ContextBar clientId={id} />
      {children}
      <ClientCommunicationsShortcut clientId={id} />
    </>
  );
}
