import type { ReactNode } from 'react';

import { Button } from './Button.js';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** z-index for backdrop (modal gets +1). Default 49 */
  zIndex?: number;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  zIndex = 50,
  className = '',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50" style={{ zIndex }} onClick={onClose} />
      <div
        className={`fixed top-1/2 left-1/2 max-h-[calc(100vh-32px)] -translate-x-1/2 -translate-y-1/2 bg-bg border-2 border-border rounded-none shadow-pixel p-4 min-w-xs flex flex-col overflow-hidden ${className}`}
        style={{ zIndex: zIndex + 1 }}
      >
        <div className="shrink-0 flex items-center justify-between py-4 px-10 border-b border-border mb-4">
          <span className="text-accent-bright text-2xl">{title}</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            x
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
