'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

interface WhatToBringProps {
  items: string[];
}

export default function WhatToBring({ items }: WhatToBringProps) {
  const [open, setOpen] = useState(false);
  const t = useI18n();

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-black uppercase tracking-widest border-2 border-black px-2 py-1 bg-[#f9c700] shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="inline-block"
        >
          ▶
        </motion.span>
        {t.whatToBring}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            key="list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden mt-1 border-2 border-black border-t-0 bg-white"
          >
            {items.map((item) => (
              <li
                key={item}
                className="px-3 py-1 text-xs font-medium border-b border-black last:border-b-0 flex items-center gap-2"
              >
                <span className="text-[#f9c700] font-black">—</span>
                {t.translateItem(item)}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
