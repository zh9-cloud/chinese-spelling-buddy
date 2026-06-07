import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <span className="text-7xl mb-4">🤔</span>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">找不到这个页面</h1>
      <p className="text-gray-500 mb-8">Page not found</p>
      <Link
        href="/"
        className="bg-brand-500 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:bg-brand-600 transition-colors"
      >
        回到主页
      </Link>
    </div>
  );
}
