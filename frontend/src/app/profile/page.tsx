"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { User } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get("/api/accounts/profile/");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "shelter":
        return "団体スタッフ";
      case "admin":
        return "管理者";
      default:
        return "飼い主希望者";
    }
  };

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case "shelter":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "admin":
        return "bg-purple-100 text-purple-600 border-purple-200";
      default:
        return "bg-pink-100 text-pink-600 border-pink-200";
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
          {/* プロフィールカード */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-pink-100">
            {/* ヘッダー部分 */}
            <div className="bg-gradient-to-r from-pink-400 to-pink-500 px-8 py-10 text-white">
              <div className="flex items-center gap-6">
                {/* アバター */}
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold border-4 border-white/30">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
                  <p className="text-pink-100">{user.email}</p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full border ${getUserTypeBadgeColor(
                      user.user_type
                    )}`}
                  >
                    {getUserTypeLabel(user.user_type)}
                  </span>
                </div>
              </div>
            </div>

            {/* プロフィール情報 */}
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  プロフィール情報
                </h2>
                <Link
                  href="/profile/edit"
                  className="px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-xl hover:bg-pink-600 transition-colors shadow-md"
                >
                  ✏️ 編集
                </Link>
              </div>

              <div className="space-y-6">
                {/* 自己紹介 */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">
                    自己紹介
                  </label>
                  <div className="bg-gray-50 rounded-xl p-4 text-gray-700">
                    {user.bio || (
                      <span className="text-gray-400 italic">
                        自己紹介が設定されていません
                      </span>
                    )}
                  </div>
                </div>

                {/* 連絡先情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">
                      メールアドレス
                    </label>
                    <div className="bg-gray-50 rounded-xl p-4 text-gray-700 flex items-center gap-2">
                      <span>📧</span>
                      {user.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">
                      電話番号
                    </label>
                    <div className="bg-gray-50 rounded-xl p-4 text-gray-700 flex items-center gap-2">
                      <span>📞</span>
                      {user.phone_number || (
                        <span className="text-gray-400 italic">未設定</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 住所 */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">
                    住所
                  </label>
                  <div className="bg-gray-50 rounded-xl p-4 text-gray-700 flex items-center gap-2">
                    <span>📍</span>
                    {user.address || (
                      <span className="text-gray-400 italic">未設定</span>
                    )}
                  </div>
                </div>

                {/* アカウント情報 */}
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    アカウント情報
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">ユーザーID:</span>
                      <span className="ml-2 text-gray-700">#{user.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">登録日:</span>
                      <span className="ml-2 text-gray-700">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("ja-JP")
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* クイックリンク */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/applications"
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-pink-200 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <h3 className="font-medium text-gray-800">申請履歴</h3>
                <p className="text-sm text-gray-500">里親申請の状況を確認</p>
              </div>
            </Link>

            <Link
              href="/"
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-pink-200 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl">
                🐱
              </div>
              <div>
                <h3 className="font-medium text-gray-800">保護猫を探す</h3>
                <p className="text-sm text-gray-500">新しい家族を見つける</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
