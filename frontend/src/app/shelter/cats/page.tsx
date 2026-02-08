"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { CatList } from "@/types";

export default function ShelterCatsPage() {
  const router = useRouter();
  const [cats, setCats] = useState<CatList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    const fetchMyCats = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/shelter/login");
        return;
      }

      try {
        // プロフィール情報を取得して権限を確認
        const userResponse = await api.get("/api/accounts/profile/");
        setIsSuperUser(userResponse.data.is_superuser || userResponse.data.shelter_role === 'admin');

        const response = await api.get("/api/cats/my_cats/");
        setCats(response.data.results || response.data);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/shelter/login");
        } else {
          setError("情報の取得に失敗しました。");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCats();
  }, [router]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      open: { label: "募集中", color: "bg-green-100 text-green-600" },
      paused: { label: "一時停止", color: "bg-yellow-100 text-yellow-600" },
      in_review: { label: "審査中", color: "bg-blue-100 text-blue-600" },
      trial: { label: "トライアル中", color: "bg-purple-100 text-purple-600" },
      adopted: { label: "譲渡済み", color: "bg-gray-100 text-gray-600" },
    };
    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-600" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* パンくずリスト */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/shelter/dashboard" className="hover:text-blue-600">
              ダッシュボード
            </Link>
            <span>/</span>
            <span className="text-gray-800">猫の管理</span>
          </div>

          {/* ヘッダー */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">猫の管理</h1>
              <p className="text-gray-500 mt-1">登録済みの保護猫を管理します</p>
            </div>
            {isSuperUser && (
              <Link
                href="/shelter/cats/new"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>➕</span>
                新しい猫を登録
              </Link>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
              {error}
            </div>
          )}

          {/* 猫一覧 */}
          {cats.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        猫
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        性別・年齢
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        登録日
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cats.map((cat) => (
                      <tr 
                        key={cat.id} 
                        onClick={() => router.push(`/shelter/cats/${cat.id}/edit`)}
                        className="hover:bg-blue-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                              {cat.primary_image ? (
                                <img
                                  src={cat.primary_image}
                                  alt={cat.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                  🐱
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{cat.name}</p>
                              <p className="text-sm text-gray-500">{cat.breed || "MIX"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700">
                            {cat.gender === "male" ? "♂ オス" : cat.gender === "female" ? "♀ メス" : "不明"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {cat.estimated_age || cat.age_category || "不明"}
                          </p>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(cat.status)}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(cat.created_at).toLocaleDateString("ja-JP")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">🐱</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">まだ猫が登録されていません</h3>
              <p className="text-gray-500 mb-6">
                新しい保護猫を登録して、里親を募集しましょう
              </p>
              {isSuperUser ? (
                <Link
                  href="/shelter/cats/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <span>➕</span>
                  最初の猫を登録する
                </Link>
              ) : (
                <p className="text-sm text-gray-400">
                  ※新しい猫の登録は管理人のみ可能です
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
