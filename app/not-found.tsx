import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <h1 className="text-xl font-semibold text-gray-700">ページが見つかりません</h1>
        <p className="text-sm text-gray-500">お探しのページは存在しないか、移動した可能性があります。</p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
