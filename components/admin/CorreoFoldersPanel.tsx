'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Folder, FolderPlus, Inbox, Pencil, RefreshCw, Send, Trash2, X, Check } from 'lucide-react';

interface FolderRow {
  id: string;
  name: string;
  slug: string;
  system_key: 'inbox' | 'sent' | null;
  is_system: boolean;
  sort_order: number;
  count: number;
}

export function CorreoFoldersPanel() {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/correo/folders', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudieron cargar las carpetas');
      setFolders(data.folders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las carpetas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createFolder = async () => {
    if (!newName.trim()) return;
    setBusyId('new');
    setError(null);
    try {
      const res = await fetch('/api/admin/correo/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo crear la carpeta');
      setNewName('');
      setCreating(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la carpeta');
    } finally {
      setBusyId(null);
    }
  };

  const renameFolder = async (id: string) => {
    if (!editingName.trim()) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch('/api/admin/correo/folders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editingName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo renombrar la carpeta');
      setEditingId(null);
      setEditingName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo renombrar la carpeta');
    } finally {
      setBusyId(null);
    }
  };

  const deleteFolder = async (folder: FolderRow) => {
    if (folder.is_system) return;
    if (!window.confirm(`Eliminar la carpeta “${folder.name}”? Los correos no se eliminarán.`)) return;
    setBusyId(folder.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/correo/folders?id=${encodeURIComponent(folder.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo eliminar la carpeta');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la carpeta');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <aside className="w-full border-b border-[#d8cbb5] bg-[#faf8f2] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between border-b border-[#d8cbb5] px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#29384a]/60">Carpetas</p>
          <p className="mt-0.5 text-[10px] text-[#29384a]/50">Correo 360</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => void load()} disabled={loading} title="Actualizar carpetas"
            className="rounded-lg p-1.5 text-[#29384a]/60 hover:bg-white hover:text-[#07111d] disabled:opacity-40">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={() => setCreating(true)} title="Nueva carpeta"
            className="rounded-lg p-1.5 text-[#c88b25] hover:bg-white">
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <p className="mx-3 mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="space-y-1 p-2">
        {folders.map((folder) => {
          const Icon = folder.system_key === 'inbox' ? Inbox : folder.system_key === 'sent' ? Send : Folder;
          const editing = editingId === folder.id;
          const label = (
            <>
              <Icon className={`h-4 w-4 shrink-0 ${folder.is_system ? 'text-[#c88b25]' : 'text-[#29384a]/60'}`} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#07111d]">{folder.name}</span>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#29384a]/60">{folder.count}</span>
            </>
          );

          if (folder.is_system) {
            return (
              <div key={folder.id} className="flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-2">
                {label}
              </div>
            );
          }

          return (
            <div key={folder.id} className="group flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-white">
              {editing ? (
                <>
                  <Icon className="h-4 w-4 shrink-0 text-[#29384a]/60" />
                  <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void renameFolder(folder.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="min-w-0 flex-1 rounded border border-[#d8cbb5] bg-white px-2 py-1 text-xs outline-none focus:border-[#c88b25]" />
                  <button type="button" disabled={busyId === folder.id} onClick={() => void renameFolder(folder.id)} className="rounded p-1 text-green-700 hover:bg-green-50"><Check className="h-3 w-3" /></button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded p-1 text-[#29384a]/60 hover:bg-gray-100"><X className="h-3 w-3" /></button>
                </>
              ) : (
                <>
                  <Link href={`/admin/correo/carpetas/${folder.id}`} className="flex min-w-0 flex-1 items-center gap-2" title={`Abrir ${folder.name}`}>
                    {label}
                  </Link>
                  <div className="hidden items-center gap-0.5 group-hover:flex">
                    <button type="button" onClick={() => { setEditingId(folder.id); setEditingName(folder.name); }} className="rounded p-1 text-[#29384a]/60 hover:bg-gray-100" title="Renombrar"><Pencil className="h-3 w-3" /></button>
                    <button type="button" disabled={busyId === folder.id} onClick={() => void deleteFolder(folder)} className="rounded p-1 text-red-600 hover:bg-red-50" title="Eliminar"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {creating && (
          <div className="mt-2 rounded-xl border border-[#d8cbb5] bg-white p-2">
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de carpeta"
              onKeyDown={(e) => { if (e.key === 'Enter') void createFolder(); if (e.key === 'Escape') setCreating(false); }}
              className="w-full rounded-lg border border-[#d8cbb5] px-2.5 py-2 text-xs outline-none focus:border-[#c88b25]" />
            <div className="mt-2 flex justify-end gap-1">
              <button type="button" onClick={() => { setCreating(false); setNewName(''); }} className="rounded-lg px-2 py-1 text-xs text-[#29384a]">Cancelar</button>
              <button type="button" disabled={!newName.trim() || busyId === 'new'} onClick={() => void createFolder()}
                className="rounded-lg bg-[#07111d] px-2.5 py-1 text-xs font-bold text-white disabled:opacity-40">Crear</button>
            </div>
          </div>
        )}
      </div>

      <p className="px-4 pb-4 text-[10px] leading-4 text-[#29384a]/50">
        Entrantes y Enviados son carpetas del sistema. Abre una carpeta personalizada para consultar sus hilos sin salir de EXPERT.
      </p>
    </aside>
  );
}
