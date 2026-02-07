"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { User } from "@/types";

interface ProfileFormData {
  phone_number: string;
  address: string;
  bio: string;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    phone_number: "",
    address: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get("/api/accounts/profile/");
        const userData = response.data;
        setUser(userData);
        setFormData({
          phone_number: userData.phone_number || "",
          address: userData.address || "",
          bio: userData.bio || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const response = await api.patch("/api/accounts/profile/", formData);
      setUser(response.data);
      setSuccessMessage("プロフィールを更新しました！");
      
      // 3秒後にメッセージをクリア
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Update error:", err);
      if (err.response?.data) {
        const data = err.response.data;
        const fieldErrors: Record<string, string> = {};

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
          setErrors({ general: "更新に失敗しました。" });
        }
      } else {
        setErrors({ general: "更新に失敗しました。しばらく経ってから再度お試しください。" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 戻るリンク */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-500 mb-6 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            プロフィールに戻る
          </Link>

          {/* 編集カード */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
            {/* ヘッダー */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full mb-4">
                <span className="text-3xl">✏️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                プロフィール編集
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                あなたの情報を更新できます
              </p>
            </div>

            {/* 成功メッセージ */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm flex items-center gap-2">
                <span className="text-lg">✅</span>
                {successMessage}
              </div>
            )}

            {/* エラーメッセージ */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            {/* 固定情報 */}
            <div className="mb-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                アカウント情報（変更不可）
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">ユーザー名:</span>
                  <span className="ml-2 text-gray-700 font-medium">
                    {user.username}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">メールアドレス:</span>
                  <span className="ml-2 text-gray-700 font-medium">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* 編集フォーム */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 電話番号 */}
              <div>
                <label
                  htmlFor="phone_number"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  電話番号
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.phone_number
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  } focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all`}
                  placeholder="090-1234-5678"
                />
                {errors.phone_number && (
                  <p className="mt-1.5 text-sm text-red-500">
                    {errors.phone_number}
                  </p>
                )}
              </div>

              {/* 住所 */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  住所
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.address
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  } focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all`}
                  placeholder="東京都渋谷区..."
                />
                {errors.address && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              {/* 自己紹介 */}
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  自己紹介
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.bio ? "border-red-300 bg-red-50" : "border-gray-200"
                  } focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all resize-none`}
                  placeholder="猫との暮らしへの想いや、飼育経験などを書いてください..."
                />
                {errors.bio && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.bio}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  里親申請時に団体に公開されます
                </p>
              </div>

              {/* ボタン */}
              <div className="flex gap-4 pt-4">
                <Link
                  href="/profile"
                  className="flex-1 py-3.5 text-center border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-pink-600 hover:to-pink-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
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
                      保存中...
                    </span>
                  ) : (
                    "保存する"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
