"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

interface Application {
  id: number;
  cat: number;
  cat_detail: {
    id: number;
    name: string;
    primary_image?: string;
    breed?: string;
  };
  applicant_info: {
    id: number;
    username: string;
  };
  status: string;
  motivation: string;
  applied_at: string;
  updated_at: string;
  full_name?: string;
  phone_number?: string;
  address?: string;
}

export default function ShelterApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/shelter/login");
        return;
      }

      try {
        const response = await api.get("/api/applications/applications/");
        setApplications(response.data.results || response.data);
      } catch (err: any) {
        console.error("Failed to fetch applications:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/shelter/login");
        } else {
          setError("申請情報を取得できませんでした。");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [router]);

  const getStatusInfo = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
      pending: { label: "応募直後", color: "text-orange-600", bgColor: "bg-orange-100" },
      reviewing: { label: "確認/面談調整中", color: "text-blue-600", bgColor: "bg-blue-100" },
      accepted: { label: "成立", color: "text-green-600", bgColor: "bg-green-100" },
      rejected: { label: "不成立", color: "text-red-600", bgColor: "bg-red-100" },
      cancelled: { label: "キャンセル", color: "text-gray-600", bgColor: "bg-gray-100" },
    };
    return statusConfig[status] || { label: status, color: "text-gray-600", bgColor: "bg-gray-100" };
  };

  const updateStatus = async (applicationId: number, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      await api.patch(`/api/applications/applications/${applicationId}/status/`, {
        status: newStatus,
      });
      
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert("ステータスの更新に失敗しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApplications = statusFilter
    ? applications.filter((app) => app.status === statusFilter)
    : applications;

  // 統計
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewing: applications.filter((a) => a.status === "reviewing").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
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
            <span className="text-gray-800">申請一覧</span>
          </div>

          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">里親申請一覧</h1>
            <p className="text-gray-500 mt-1">保護猫への里親申請を確認・管理します</p>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setStatusFilter("")}
              className={`p-4 rounded-xl border transition-all ${
                statusFilter === ""
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-100 hover:border-blue-200"
              }`}
            >
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-500">全件</p>
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`p-4 rounded-xl border transition-all ${
                statusFilter === "pending"
                  ? "bg-orange-50 border-orange-200"
                  : "bg-white border-gray-100 hover:border-orange-200"
              }`}
            >
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">未確認</p>
            </button>
            <button
              onClick={() => setStatusFilter("reviewing")}
              className={`p-4 rounded-xl border transition-all ${
                statusFilter === "reviewing"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-100 hover:border-blue-200"
              }`}
            >
              <p className="text-2xl font-bold text-blue-600">{stats.reviewing}</p>
              <p className="text-sm text-gray-500">確認中</p>
            </button>
            <button
              onClick={() => setStatusFilter("accepted")}
              className={`p-4 rounded-xl border transition-all ${
                statusFilter === "accepted"
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-100 hover:border-green-200"
              }`}
            >
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              <p className="text-sm text-gray-500">成立</p>
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
              {error}
            </div>
          )}

          {/* 申請一覧 */}
          {filteredApplications.length > 0 ? (
            <div className="space-y-4">
              {filteredApplications.map((application) => {
                const statusInfo = getStatusInfo(application.status);
                const isUpdating = updatingId === application.id;

                return (
                  <div
                    key={application.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* 猫情報 */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {application.cat_detail.primary_image ? (
                            <img
                              src={application.cat_detail.primary_image}
                              alt={application.cat_detail.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              🐱
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/cats/${application.cat_detail.id}`}
                            className="font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                          >
                            {application.cat_detail.name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {application.cat_detail.breed || "MIX"}
                          </p>
                        </div>
                      </div>

                      {/* 申請者情報 */}
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">申請者</p>
                        <p className="font-medium text-gray-800">
                          {application.full_name || application.applicant_info.username}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(application.applied_at).toLocaleDateString("ja-JP")} 申請
                        </p>
                      </div>

                      {/* ステータス */}
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* アクション */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {application.status === "pending" && (
                          <button
                            onClick={() => updateStatus(application.id, "reviewing")}
                            disabled={isUpdating}
                            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            確認中へ
                          </button>
                        )}
                        {application.status === "reviewing" && (
                          <>
                            <button
                              onClick={() => updateStatus(application.id, "accepted")}
                              disabled={isUpdating}
                              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              承認
                            </button>
                            <button
                              onClick={() => updateStatus(application.id, "rejected")}
                              disabled={isUpdating}
                              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              不承認
                            </button>
                          </>
                        )}
                        <Link
                          href={`/shelter/applications/${application.id}`}
                          className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          詳細
                        </Link>
                      </div>
                    </div>

                    {/* 応募動機（プレビュー） */}
                    {application.motivation && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">応募動機</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {application.motivation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {statusFilter ? "該当する申請がありません" : "まだ申請がありません"}
              </h3>
              <p className="text-gray-500 mb-6">
                {statusFilter
                  ? "フィルターを変更して、他の申請を確認してください。"
                  : "保護猫への里親申請が届くと、ここに表示されます。"}
              </p>
              {statusFilter && (
                <button
                  onClick={() => setStatusFilter("")}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  すべて表示
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
