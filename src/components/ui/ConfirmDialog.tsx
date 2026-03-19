interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = '확인', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-td-overlay/90 backdrop-blur-2xl border border-td-border rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-td-text">{title}</h3>
        <p className="mt-2 text-sm text-td-text-secondary">{message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-td-text-secondary hover:bg-td-hover-strong rounded-lg transition-colors">
            취소
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 backdrop-blur rounded-lg transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
