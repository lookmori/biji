"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/notes");
    } catch (err: any) {
      setError(err.message || "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green flex items-center justify-center">
              <span className="text-white text-sm font-bold" style={{ fontFamily: '"Songti SC", serif' }}>B</span>
            </div>
            <span className="text-ink text-lg font-bold tracking-[0.12em]" style={{ fontFamily: '"Songti SC", serif' }}>BIJI</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-line p-6 shadow-l">
          <h1 className="text-xl font-bold text-ink mb-6" style={{ fontFamily: '"Songti SC", serif' }}>登录</h1>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">邮箱</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="your@email.com"
                className="w-full h-[46px] px-3 rounded-xl bg-input-bg border border-[#D4DDD6] text-sm font-semibold text-ink placeholder:text-muted/40 outline-none focus:border-green focus:ring-3 focus:ring-green/15 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">密码</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required placeholder="至少 6 位" minLength={6}
                className="w-full h-[46px] px-3 rounded-xl bg-input-bg border border-[#D4DDD6] text-sm font-semibold text-ink placeholder:text-muted/40 outline-none focus:border-green focus:ring-3 focus:ring-green/15 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red font-semibold">{error}</p>
            )}

            <button
              type="submit" disabled={submitting}
              className="w-full h-[46px] rounded-xl bg-green-dark hover:bg-[#205541] text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-m disabled:opacity-50"
            >
              {submitting ? "登录中..." : "登录"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
