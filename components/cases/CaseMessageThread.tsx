'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  body: string;
  sender_role: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export function CaseMessageThread({ caseId, initialMessages, currentRole }: {
  caseId: string;
  initialMessages: Message[];
  currentRole: 'admin' | 'client';
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [initialMessages]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/cases/${caseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? 'No se pudo enviar'); return; }
      setBody('');
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  };

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#07111d]">Mensajes</h3>

      <div className="mb-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
        {initialMessages.length === 0 ? (
          <p className="text-center text-sm text-[#29384a]">No hay mensajes todavía. Puedes escribirnos aquí.</p>
        ) : (
          initialMessages.map((msg) => {
            const isOwn = msg.sender_role === currentRole;
            const senderName = msg.sender_role === 'admin'
              ? 'Asesoría EXPERT'
              : (msg.profiles?.full_name ?? 'Tú');
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isOwn ? 'bg-[#061321] text-white' : 'bg-white border border-[#d8cbb5] text-[#07111d]'}`}>
                  <p className={`mb-1 text-xs font-semibold ${isOwn ? 'text-[#d7a33a]' : 'text-[#c88b25]'}`}>{senderName}</p>
                  <p className="text-sm leading-relaxed">{msg.body}</p>
                  <p className={`mt-1 text-xs ${isOwn ? 'text-white/50' : 'text-[#29384a]'}`}>
                    {new Date(msg.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe un mensaje... (Ctrl+Enter para enviar)"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
        />
        <button type="button" onClick={handleSend} disabled={sending || !body.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-5 py-3 text-sm font-bold text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-60">
          <Send className="h-4 w-4" />
          {sending ? '...' : 'Enviar'}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
