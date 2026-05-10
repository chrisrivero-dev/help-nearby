'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface SmsButtonProps {
  resourceName: string;
  resourceAddress: string;
}

type Status = 'idle' | 'entering' | 'sending' | 'sent' | 'error';

export default function SmsButton({ resourceName, resourceAddress }: SmsButtonProps) {
  const t = useI18n();
  const [status, setStatus] = useState<Status>('idle');
  const [phone, setPhone] = useState('');

  const handleInitiate = () => setStatus('entering');

  const digits = phone.replace(/\D/g, '');
  const phoneReady = digits.length >= 10;

  const handleSend = async () => {
    if (!phoneReady) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, resourceName, resourceAddress }),
      });
      if (!res.ok) throw new Error('non-2xx');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <p className="text-xs font-black uppercase tracking-widest text-[#10b981] mt-2">
        ✓ {t.sent}
      </p>
    );
  }

  if (status === 'idle') {
    return (
      <button
        onClick={handleInitiate}
        className="mt-2 text-xs font-black uppercase tracking-widest border-2 border-black px-2 py-1 bg-white shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        📱 {t.textResults}
      </button>
    );
  }

  return (
    <div className="mt-2 flex gap-1">
      <input
        type="tel"
        value={phone}
        onChange={(e) => { setPhone(e.target.value); if (status === 'error') setStatus('entering'); }}
        placeholder={t.phone_placeholder}
        className="text-xs border-2 border-black px-2 py-1 outline-none focus:ring-0 w-36 font-mono"
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        autoFocus
      />
      <button
        onClick={handleSend}
        disabled={status === 'sending' || !phoneReady}
        className="text-xs font-black uppercase tracking-widest border-2 border-black px-2 py-1 bg-[#f9c700] shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[2px_2px_0px_#000]"
      >
        {status === 'sending' ? t.sending : status === 'error' ? t.error : '→'}
      </button>
      <button
        onClick={() => { setStatus('idle'); setPhone(''); }}
        className="text-xs border-2 border-black px-2 py-1 bg-white hover:bg-neutral-100"
      >
        ✕
      </button>
    </div>
  );
}
