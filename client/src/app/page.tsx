"use client";
import { useState } from "react";

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // register state
  const [rname, setRName] = useState("");
  const [remail, setREmail] = useState("");
  const [rpassword, setRPassword] = useState("");
  const [rloading, setRLoading] = useState(false);
  const [rerror, setRError] = useState<string | null>(null);
  const [rsuccess, setRSuccess] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.detail || j || res.statusText || "Login failed");
      }
      const data = await res.json();
      if (data?.access_token) {
        localStorage.setItem("token", data.access_token);
        try {
          const existing = JSON.parse(localStorage.getItem("user") || "null");
          const newUser = { ...(existing || {}), email };
          localStorage.setItem("user", JSON.stringify(newUser));
        } catch (e) {}
      }
      window.location.href = "/myday";
    } catch (err: any) {
      if (err instanceof TypeError) {
        setError("Network error hoặc CORS blocked request.");
      } else {
        setError(err?.message || "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRLoading(true);
    setRError(null);
    setRSuccess(null);
    try {
      if (!remail || !remail.includes("@")) {
        setRError("Vui lòng nhập email hợp lệ.");
        setRLoading(false);
        return;
      }
      if (!rpassword || rpassword.length < 6) {
        setRError("Mật khẩu phải có tối thiểu 6 ký tự.");
        setRLoading(false);
        return;
      }
      const res = await fetch(`/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: rname,
          email: remail,
          password: rpassword,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.detail || j || res.statusText || "Register failed");
      }
      const created = await res.json().catch(() => null);
      try {
        const existing = JSON.parse(localStorage.getItem("user") || "null");
        const newUser = {
          ...(existing || {}),
          id: created?.id,
          email: created?.email,
          full_name: rname,
        };
        localStorage.setItem("user", JSON.stringify(newUser));
      } catch (e) {}
      setRSuccess("Đăng ký thành công. Bạn có thể đăng nhập ngay.");
      // switch to login view
      setIsRegister(false);
      setEmail(remail);
    } catch (err: any) {
      if (err instanceof TypeError)
        setRError("Network error hoặc CORS blocked request.");
      else setRError(err?.message || "Unknown error");
    } finally {
      setRLoading(false);
    }
  }

  return (
    <main className="p-6">
      <div className="max-w-3xl mx-auto grid grid-cols-2 gap-6 items-start">
        <div>
          <h1 className="text-3xl font-bold mb-4">
            Chào mừng đến với Agent TODO
          </h1>
          <p className="mb-4">Quản lý công việc đơn giản và hiệu quả.</p>
          <div className="space-x-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setIsRegister(false)}
            >
              Đăng nhập
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              onClick={() => setIsRegister(true)}
            >
              Đăng ký
            </button>
          </div>
        </div>

        <div>
          {!isRegister ? (
            <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
              <h2 className="text-xl font-semibold mb-4">Đăng nhập</h2>
              <form onSubmit={handleLogin} className="space-y-4">
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
            </div>
          ) : (
            <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
              <h2 className="text-xl font-semibold mb-4">Tạo tài khoản</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm">Họ và tên</label>
                  <input
                    type="text"
                    value={rname}
                    onChange={(e) => setRName(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm">Email</label>
                  <input
                    type="email"
                    value={remail}
                    onChange={(e) => setREmail(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm">Mật khẩu</label>
                  <input
                    type="password"
                    value={rpassword}
                    onChange={(e) => setRPassword(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                {rerror && <div className="text-sm text-red-600">{rerror}</div>}
                {rsuccess && (
                  <div className="text-sm text-green-600">{rsuccess}</div>
                )}
                <div>
                  <button
                    type="submit"
                    disabled={rloading}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    {rloading ? "Đang..." : "Đăng ký"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
