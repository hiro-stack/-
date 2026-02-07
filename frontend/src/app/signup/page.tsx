"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 入力時にそのフィールドのエラーをクリア
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // クライアント側バリデーション
    const newErrors: Record<string, string> = {};
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = "パスワードが一致しません";
    }
    if (formData.password.length < 8) {
      newErrors.password = "パスワードは8文字以上で入力してください";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/accounts/register/", formData);
      const { tokens } = response.data;

      // Cookieにトークンを保存
      const isSecure = process.env.NODE_ENV === "production";
      Cookies.set("access_token", tokens.access, { expires: 1, secure: isSecure, sameSite: "Lax" });
      Cookies.set("refresh_token", tokens.refresh, { expires: 7, secure: isSecure, sameSite: "Lax" });

      // ホームへリダイレクト
      router.push("/");
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.response?.data) {
        const data = err.response.data;
        const fieldErrors: Record<string, string> = {};
        
        // フィールドごとのエラーを処理
        Object.keys(data).forEach((key) => {
          if (Array.isArray(data[key])) {
            fieldErrors[key] = data[key][0];
          } else if (typeof data[key] === "string") {
            fieldErrors[key] = data[key];
          }
        });

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          setErrors({ general: "登録に失敗しました。入力内容を確認してください。" });
        }
      } else {
        setErrors({ general: "登録に失敗しました。しばらく経ってから再度お試しください。" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          {/* 登録カード */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
            {/* アイコン */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">新規登録</h1>
              <p className="text-gray-500 mt-2 text-sm">
                保護猫との出会いを始めましょう
              </p>
            </div>

            {/* 一般エラーメッセージ */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            {/* 登録フォーム */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  ユーザー名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.username ? "border-red-300 bg-red-50" : "border-gray-200"
                  } focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all`}
                  placeholder="ユーザー名を入力"
                />
                {errors.username && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  メールアドレス <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                  } focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  パスワード <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.password ? "border-red-300 bg-red-50" : "border-gray-200"
                  } focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all`}
                  placeholder="8文字以上で入力"
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password_confirm"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  パスワード（確認） <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.password_confirm ? "border-red-300 bg-red-50" : "border-gray-200"
                  } focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all`}
                  placeholder="パスワードを再入力"
                />
                {errors.password_confirm && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.password_confirm}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-pink-600 hover:to-pink-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    登録中...
                  </span>
                ) : (
                  "アカウントを作成"
                )}
              </button>
            </form>

            {/* 利用規約 */}
            <p className="mt-4 text-xs text-gray-400 text-center">
              登録することで、
              <Link href="/terms" className="text-pink-500 hover:underline">
                利用規約
              </Link>
              と
              <Link href="/privacy" className="text-pink-500 hover:underline">
                プライバシーポリシー
              </Link>
              に同意したことになります。
            </p>

            {/* 区切り線 */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-400">または</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* ログインリンク */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-3">
                すでにアカウントをお持ちの方
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 border-2 border-pink-400 text-pink-500 font-medium rounded-xl hover:bg-pink-50 transition-colors"
              >
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
