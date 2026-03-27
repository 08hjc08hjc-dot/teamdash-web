'use client';

export default function TaskDetailError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <h2 className="text-xl font-bold text-red-400 mb-2">작업 상세 오류</h2>
      <pre className="text-sm text-td-text-muted bg-td-card border border-td-border rounded-xl p-4 mb-4 text-left overflow-auto whitespace-pre-wrap">
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
