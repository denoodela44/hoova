export default function ConfirmModal({ message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-gray-800 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: danger ? '#dc2626' : '#1a1a2e' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
