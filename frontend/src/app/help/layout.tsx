import type { ReactNode } from 'react';

export default function HelpLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-[#eef0f2] text-black">
      {children}
    </div>
  );
}