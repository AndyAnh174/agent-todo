"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
        // simple client-side validation to avoid 422 from backend
        if (!email || !email.includes("@")) {
          setError("Vui lòng nhập email hợp lệ.");
          setLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setError("Mật khẩu phải có tối thiểu 6 ký tự.");
          setLoading(false);
          return;
        }
      // use relative path; Next.js rewrites /api to backend in dev/production config
      const res = await fetch(`/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          // backend expects `full_name` field
          body: JSON.stringify({ full_name: name, email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        // normalize error message (detail may be object)
        const formatDetail = (d: any) => {
          if (!d) return null;
          if (typeof d === "string") return d;
          if (Array.isArray(d)) return d.join(", ");
          if (typeof d === "object") {
            try {
              const vals = Object.values(d).flat?.() || Object.values(d);
              return vals.join ? vals.join(", ") : JSON.stringify(d);
            } catch (e) {
              return JSON.stringify(d);
            }
          }
          return String(d);
        };
        const msg = formatDetail(j?.detail) || formatDetail(j) || res.statusText || "Register failed";
        throw new Error(msg);
      }
      setSuccess("Đăng ký thành công. Bạn có thể đăng nhập ngay.");
    } catch (err: any) {
      if (err instanceof TypeError) {
        setError("Network error hoặc CORS blocked request. Kiểm tra backend đang chạy và CORS hoặc cấu hình URL.");
      } else {
        setError(err?.message || "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Đăng ký</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Họ và tên</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {loading ? "Đang..." : "Đăng ký"}
          </button>
        </div>
      </form>
    </main>
  );
}
