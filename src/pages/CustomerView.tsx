import React, { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/apiFetch';

interface SmartTag {
  id: string;
  type: string;
  number: string;
  capacity?: number;
  zone?: string;
  status: string;
  smartLink?: string;
  lastScanned?: string;
}

export function CustomerView() {
  const [tableId, setTableId] = useState<string | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTableId(params.get('meja'));
    setZone(params.get('zona'));
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await apiFetch('/api/public/smart-tags');
        const data = await res.json();
        if (Array.isArray(data)) {
          const matched = data.find((t: SmartTag) => t.number === tableId);
          setIsOpen(matched ? matched.status !== 'Nonaktif' : false);
        }
      } catch (e) {
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };
    if (tableId) checkStatus();
    else { setIsOpen(false); setLoading(false); }
  }, [tableId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">Memuat...</div>;
  }

  if (!isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-stone-900">Ngolab tutup</h1>
          <p className="text-stone-500">Silakan kembali saat jam operasional.</p>
          {tableId && <p className="text-xs text-stone-400">Meja {tableId}{zone ? ` • Zona ${zone}` : ''}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Selamat Datang</h1>
          <p className="text-stone-500 text-sm">Meja {tableId}{zone ? ` • Zona ${zone}` : ''}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-600">Katalog menu untuk pelanggan akan ditampilkan di sini.</p>
        </div>
      </div>
    </div>
  );
}
