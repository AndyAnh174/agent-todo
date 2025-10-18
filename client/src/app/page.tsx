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
      window.location.href = "/chat";
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* LEFT SIDE */}
        <div className="text-center md:text-left space-y-4">
          <h1 className="text-4xl font-bold text-indigo-700">
            Chào mừng đến với <span className="text-blue-600">Agent TODO</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Quản lý công việc của bạn một cách đơn giản và hiệu quả.
          </p>
          <div className="space-x-3">
            <button
              className={`px-5 py-2.5 rounded-lg font-medium shadow transition ${
                !isRegister
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
              }`}
              onClick={() => setIsRegister(false)}
            >
              Đăng nhập
            </button>
            <button
              className={`px-5 py-2.5 rounded-lg font-medium shadow transition ${
                isRegister
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-white text-green-600 border border-green-600 hover:bg-green-50"
              }`}
              onClick={() => setIsRegister(true)}
            >
              Đăng ký
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {!isRegister ? (
            <>
              <h2 className="text-2xl font-semibold text-center text-blue-700 mb-6">
                Đăng nhập tài khoản
              </h2>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  />
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-center text-green-700 mb-6">
                Tạo tài khoản mới
              </h2>
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={rname}
                    onChange={(e) => setRName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={remail}
                    onChange={(e) => setREmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={rpassword}
                    onChange={(e) => setRPassword(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                  />
                </div>
                {rerror && <div className="text-sm text-red-600">{rerror}</div>}
                {rsuccess && (
                  <div className="text-sm text-green-600">{rsuccess}</div>
                )}
                <button
                  type="submit"
                  disabled={rloading}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  {rloading ? "Đang đăng ký..." : "Đăng ký"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
