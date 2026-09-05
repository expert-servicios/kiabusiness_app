import { ClientHoldedAdminPanel } from './ClientHoldedAdminPanel';

export default async function ClientIntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <ClientHoldedAdminPanel clientId={id} />
      </div>
    </main>
  );
}
