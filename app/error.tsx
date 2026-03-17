"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-gray-200">500</p>
        <h1 className="text-xl font-semibold text-gray-700">エラーが発生しました</h1>
        <p className="text-sm text-gray-500">予期しないエラーが発生しました。しばらくしてから再試行してください。</p>
        <button
          onClick={reset}
          className="inline-block mt-4 px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          再試行する
        </button>
      </div>
    </div>
  );
}
