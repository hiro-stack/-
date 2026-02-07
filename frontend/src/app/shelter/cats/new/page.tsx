"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Image as ImageIcon, Plus, X } from "lucide-react";

interface CatFormData {
  name: string;
  gender: string;
  age_years: number;
  age_months: number;
  breed: string;
  size: string;
  color: string;
  personality: string;
  health_status: string;
  vaccination: boolean;
  neutered: boolean;
  description: string;
  status: string;
}

const initialFormData: CatFormData = {
  name: "",
  gender: "unknown",
  age_years: 0,
  age_months: 0,
  breed: "",
  size: "medium",
  color: "",
  personality: "",
  health_status: "",
  vaccination: false,
  neutered: false,
  description: "",
  status: "open",
};

export default function NewCatPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CatFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 画像アップロード用State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/shelter/login");
        return;
      }

      try {
        const response = await api.get("/api/accounts/profile/");
        if (response.data.user_type !== "shelter" && response.data.user_type !== "admin") {
          router.push("/");
          return;
        }
      } catch (error) {
        router.push("/shelter/login");
        return;
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // 1. 猫情報の作成
      const response = await api.post("/api/cats/", formData);
      const catId = response.data.id;

      // 2. 画像があればアップロード
      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append("image", selectedImage);
        imageFormData.append("is_primary", "true");
        
        try {
          await api.post(`/api/cats/${catId}/images/`, imageFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } catch (imageErr) {
          console.error("Image upload failed:", imageErr);
          // 画像アップロード失敗しても、猫自体は作成されているのでリダイレクトは続行するが、
          // ユーザーに伝えるべきかもしれない。今回は簡易的にコンソールログのみ。
        }
      }

      router.push(`/shelter/cats/${catId}/edit?created=true`);
    } catch (err: any) {
      console.error("Create error:", err);
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
          setErrors({ general: "登録に失敗しました。" });
        }
      } else {
        setErrors({ general: "登録に失敗しました。しばらく経ってから再度お試しください。" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
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
        <div className="max-w-3xl mx-auto">
          {/* パンくずリスト */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/shelter/dashboard" className="hover:text-blue-600">
              ダッシュボード
            </Link>
            <span>/</span>
            <Link href="/shelter/cats" className="hover:text-blue-600">
              猫の管理
            </Link>
            <span>/</span>
            <span className="text-gray-800">新規登録</span>
          </div>

          {/* フォームカード */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full mb-4">
                <span className="text-3xl">🐱</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">新しい猫を登録</h1>
              <p className="text-gray-500 mt-2 text-sm">
                保護猫の情報を入力してください
              </p>
            </div>

            {/* エラーメッセージ */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* メイン画像アップロード */}
              <div className="flex flex-col items-center justify-center mb-8">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg group">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <X className="w-8 h-8" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-500 transition-all"
                  >
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">写真を追加</span>
                  </button>
                )}
                <p className="mt-2 text-sm text-gray-500">メイン画像（任意）</p>
              </div>

              {/* 基本情報 */}
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 名前 */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      名前 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                      } focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                      placeholder="例：ミケ"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* 性別 */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1.5">
                      性別 <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    >
                      <option value="male">オス</option>
                      <option value="female">メス</option>
                      <option value="unknown">不明</option>
                    </select>
                  </div>

                  {/* 年齢（年） */}
                  <div>
                    <label htmlFor="age_years" className="block text-sm font-medium text-gray-700 mb-1.5">
                      年齢（年）
                    </label>
                    <input
                      type="number"
                      id="age_years"
                      name="age_years"
                      value={formData.age_years}
                      onChange={handleChange}
                      min="0"
                      max="30"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  {/* 年齢（月） */}
                  <div>
                    <label htmlFor="age_months" className="block text-sm font-medium text-gray-700 mb-1.5">
                      年齢（月）
                    </label>
                    <input
                      type="number"
                      id="age_months"
                      name="age_months"
                      value={formData.age_months}
                      onChange={handleChange}
                      min="0"
                      max="11"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  {/* 品種 */}
                  <div>
                    <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1.5">
                      品種
                    </label>
                    <input
                      type="text"
                      id="breed"
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      placeholder="例：三毛猫、MIX"
                    />
                  </div>

                  {/* 体格 */}
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1.5">
                      体格
                    </label>
                    <select
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    >
                      <option value="small">小型</option>
                      <option value="medium">中型</option>
                      <option value="large">大型</option>
                    </select>
                  </div>

                  {/* 毛色 */}
                  <div className="md:col-span-2">
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1.5">
                      毛色
                    </label>
                    <input
                      type="text"
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      placeholder="例：白・茶・黒（三毛）"
                    />
                  </div>
                </div>
              </div>

              {/* 性格・説明 */}
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">性格・説明</h2>
                
                <div className="space-y-4">
                  {/* 性格 */}
                  <div>
                    <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-1.5">
                      性格 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="personality"
                      name="personality"
                      value={formData.personality}
                      onChange={handleChange}
                      required
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.personality ? "border-red-300 bg-red-50" : "border-gray-200"
                      } focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none`}
                      placeholder="例：人懐っこく、甘えん坊な性格です..."
                    />
                    {errors.personality && <p className="mt-1 text-sm text-red-500">{errors.personality}</p>}
                  </div>

                  {/* 説明 */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                      詳しい説明 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={5}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.description ? "border-red-300 bg-red-50" : "border-gray-200"
                      } focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none`}
                      placeholder="保護の経緯や、普段の様子などを詳しく記載してください..."
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                  </div>
                </div>
              </div>

              {/* 健康状態 */}
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">健康状態</h2>

                <div className="space-y-4">
                  {/* 健康状態 */}
                  <div>
                    <label htmlFor="health_status" className="block text-sm font-medium text-gray-700 mb-1.5">
                      健康状態 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="health_status"
                      name="health_status"
                      value={formData.health_status}
                      onChange={handleChange}
                      required
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.health_status ? "border-red-300 bg-red-50" : "border-gray-200"
                      } focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none`}
                      placeholder="例：ワクチン接種済み、健康状態良好..."
                    />
                    {errors.health_status && <p className="mt-1 text-sm text-red-500">{errors.health_status}</p>}
                  </div>

                  {/* チェックボックス */}
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="vaccination"
                        checked={formData.vaccination}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-200"
                      />
                      <span className="text-sm text-gray-700">ワクチン接種済み</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="neutered"
                        checked={formData.neutered}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-200"
                      />
                      <span className="text-sm text-gray-700">去勢・避妊済み</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ステータス */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">募集状態</h2>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option value="open">募集中</option>
                  <option value="paused">一時停止</option>
                  <option value="in_review">審査中</option>
                  <option value="trial">トライアル中</option>
                  <option value="adopted">譲渡済み</option>
                </select>
              </div>

              {/* ボタン */}
              <div className="flex gap-4 pt-4">
                <Link
                  href="/shelter/cats"
                  className="flex-1 py-3.5 text-center border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                    "猫を登録"
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
