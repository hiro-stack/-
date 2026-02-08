"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { ArrowLeft, Save, Building, MapPin, Globe, Phone, Mail, Clock, ShieldCheck, AlertCircle } from "lucide-react";

interface Shelter {
  id: number;
  name: string;
  shelter_type: string;
  prefecture: string;
  city: string;
  address: string;
  postcode: string;
  email: string;
  phone: string;
  website_url: string;
  sns_url: string;
  business_hours: string;
  transfer_available_hours: string;
  registration_number: string;
  description: string;
  verification_status: string;
}

export default function ShelterProfilePage() {
  const router = useRouter();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<Partial<Shelter>>({});

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/shelter/login");
        return;
      }

      try {
        // ユーザー情報で権限チェック
        const profileRes = await api.get("/api/accounts/profile/");
        const userData = profileRes.data;
        setIsAdmin(userData.is_superuser || userData.shelter_role === "admin");

        // 団体情報取得
        const shelterRes = await api.get("/api/shelters/my-shelter/");
        setShelter(shelterRes.data);
        setFormData(shelterRes.data);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError("団体情報の取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.patch(`/api/shelters/${shelter?.id}/`, formData);
      setShelter(response.data);
      setFormData(response.data);
      setIsEditing(false);
      setSuccess("団体情報を更新しました。");
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Failed to update shelter:", err);
      setError("更新に失敗しました。入力内容を確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
          <div className="text-6xl mb-4">🏢</div>
          <p className="text-gray-500 mb-6">所属する保護団体の情報が見つかりませんでした。</p>
          <button onClick={() => router.back()} className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all">
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-20">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <Link href="/shelter/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" />
              ダッシュボードへ
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">団体プロフィール</h1>
          </div>
          
          {isAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm transition-all"
            >
              編集する
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-bold">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報セクション */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 transition-all">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Building className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">基本情報</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">団体名 / カフェ名</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900">{shelter.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">都道府県</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="prefecture"
                    value={formData.prefecture || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900">{shelter.prefecture}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">市区町村</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900">{shelter.city}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">店舗住所</label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium resize-none"
                    required
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900">{shelter.address}</p>
                )}
              </div>
            </div>
          </section>

          {/* 連絡先・ウェブサイト */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 transition-all">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-pink-50 rounded-xl">
                <Mail className="w-6 h-6 text-pink-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">連絡先・公式情報</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">代表メールアドレス</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900">{shelter.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">代表電話番号</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900">{shelter.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">公式サイトURL</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="website_url"
                    value={formData.website_url || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    placeholder="https://..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900 overflow-hidden text-ellipsis">
                    {shelter.website_url ? (
                      <a href={shelter.website_url} target="_blank" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        {shelter.website_url} <Globe className="w-3.5 h-3.5" />
                      </a>
                    ) : "未登録"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">SNS URL</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="sns_url"
                    value={formData.sns_url || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    placeholder="https://instagram.com/..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900 overflow-hidden text-ellipsis">
                    {shelter.sns_url ? (
                      <a href={shelter.sns_url} target="_blank" className="text-pink-600 hover:underline inline-flex items-center gap-1">
                        {shelter.sns_url} <Globe className="w-3.5 h-3.5" />
                      </a>
                    ) : "未登録"}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 営業情報 */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 transition-all">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-purple-50 rounded-xl">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">営業・譲渡対応情報</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">営業日・営業時間・定休日</label>
                {isEditing ? (
                  <textarea
                    name="business_hours"
                    value={formData.business_hours || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    placeholder="例: 平日11:00-20:00, 土日祝10:00-19:00, 定休日: 水曜"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900 whitespace-pre-wrap">{shelter.business_hours || "未登録"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">譲渡対応可能な時間帯</label>
                {isEditing ? (
                  <textarea
                    name="transfer_available_hours"
                    value={formData.transfer_available_hours || ""}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    placeholder="例: 平日14:00-16:00"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900 whitespace-pre-wrap">{shelter.transfer_available_hours || "未登録"}</p>
                )}
              </div>
            </div>
          </section>

          {/* 団体紹介 */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 transition-all">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-gray-50 rounded-xl">
                <AlertCircle className="w-6 h-6 text-gray-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">団体紹介・登録番号</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">団体説明</label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl text-gray-700 whitespace-pre-wrap leading-relaxed">{shelter.description || "未登録"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">動物取扱業登録番号</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50/50 rounded-2xl font-bold text-gray-900">{shelter.registration_number || "未登録"}</p>
                )}
              </div>
            </div>
          </section>

          {/* Form Actions (Only in Edit mode) */}
          {isEditing && (
            <div className="flex items-center gap-4 fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-50 animate-slide-up">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(shelter);
                  setError("");
                }}
                className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold shadow-xl hover:bg-gray-50 transition-all"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                保存して更新する
              </button>
            </div>
          )}
        </form>
      </main>

      <Footer />
    </div>
  );
}
