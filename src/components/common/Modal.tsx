import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional sticky footer (action buttons). */
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Extra classes for the scrollable body (default padding px-5 py-4). */
  bodyClassName?: string;
  /** Dark header variant (used by receipts and the admission wizard). */
  headerTone?: 'light' | 'dark';
  /** Extra content rendered in the header row, before the close button (e.g. Print). */
  headerActions?: React.ReactNode;
  /** Prevent closing by backdrop click / Esc (e.g. during a timed test). */
  dismissible?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
  '2xl': 'sm:max-w-5xl'
};

/**
 * Shared popup. The header (with its close button) stays fixed while the body scrolls,
 * so the close button is always reachable. Full-width bottom sheet on phones.
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  size = 'md',
  bodyClassName = 'px-5 py-4',
  headerTone = 'light',
  headerActions,
  dismissible = true,
  className = ''
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep the latest handlers in refs so the effects below run once per open, not on every render.
  // (Re-running them on each keystroke used to steal focus from the field being typed in.)
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissibleRef.current) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // On open only: move focus into the dialog (first field if there is one), and restore it on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const firstField = panel?.querySelector<HTMLElement>('.modal-body input:not([type=hidden]):not([type=file]):not([disabled]), .modal-body select, .modal-body textarea');
    (firstField || panel)?.focus({ preventScroll: true });
    return () => previouslyFocused?.focus?.({ preventScroll: true });
  }, []);

  const dark = headerTone === 'dark';

  return (
    <div
      className="modal-root fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs sm:p-4"
      onMouseDown={e => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={`modal-panel w-full ${SIZES[size]} max-h-[92dvh] sm:max-h-[90dvh] flex flex-col bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden outline-none ${className}`}
      >
        <div
          className={`modal-header shrink-0 flex items-start justify-between gap-3 px-5 py-3.5 border-b ${
            dark ? 'bg-slate-900 text-white border-slate-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold leading-snug ${dark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{title}</h3>
              {subtitle && <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              title="Close (Esc)"
              className={`w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                dark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={`modal-body flex-1 min-h-0 overflow-y-auto overscroll-contain ${bodyClassName}`}>{children}</div>

        {footer && (
          <div className="modal-footer shrink-0 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
