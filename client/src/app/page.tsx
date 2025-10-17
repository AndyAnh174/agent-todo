export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome to Agent TODO</h1>
      <p className="mb-4">
        Ứng dụng TODO - frontend Next.js. Backend đã có sẵn.
      </p>
      <div className="space-x-3">
        <a className="px-4 py-2 bg-blue-600 text-white rounded" href="/login">
          Đăng nhập
        </a>
        <a
          className="px-4 py-2 bg-green-600 text-white rounded"
          href="/register"
        >
          Đăng ký
        </a>
      </div>
    </main>
  );
}