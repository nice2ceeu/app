export default function ConfirmModal({ worker, onConfirm, onCancel, loading }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
  
          {/* Close */}
          <button
            onClick={onCancel}
            disabled={loading}
            className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none disabled:opacity-40"
          >
            ✕
          </button>
  
          {/* Header */}
          <div className="mb-5">
            <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-1">
              Confirm Hire
            </p>
            <h2 className="text-lg font-medium text-gray-900 tracking-tight">
              Hire {worker.firstName} {worker.lastName}?
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              This will deduct <span className="text-gray-700 font-medium">3 tokens</span> from your account.
            </p>
          </div>
  
          {/* Worker chip */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-mono text-xs text-blue-600 font-medium shrink-0">
              {worker.firstName?.[0]}{worker.lastName?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {worker.firstName} {worker.lastName}
              </p>
              <p className="font-mono text-xs text-gray-400">{worker.jobTitle}</p>
            </div>
          </div>
  
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full py-2.5 text-sm font-mono tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              {loading ? "Hiring…" : "Confirm Hire"}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full py-2.5 text-sm font-mono tracking-wider text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl border border-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
  
        </div>
      </div>
    );
  }