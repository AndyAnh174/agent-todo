"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // use relative path; Next.js rewrites /api to backend in dev/production config
      const res = await fetch(`/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
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
        const msg = formatDetail(j?.detail) || formatDetail(j) || res.statusText || "Login failed";
        throw new Error(msg);
      }
      const data = await res.json();
      // store token (simple approach) — you may replace with secure storage
      if (data?.access_token) {
        localStorage.setItem("token", data.access_token);
      }
      // redirect to home
      window.location.href = "/";
    } catch (err: any) {
      // network errors (CORS, server down) show as TypeError in fetch
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
      <h1 className="text-2xl font-semibold mb-4">Đăng nhập</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Đang..." : "Đăng nhập"}
          </button>
        </div>
      </form>
    </main>
  );
}
