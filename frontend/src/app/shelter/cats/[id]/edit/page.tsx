"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { CatDetail, CatImage, CatVideo } from "@/types";
import { Image as ImageIcon, Video as VideoIcon, Plus, X, Upload } from "lucide-react";

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

interface PendingFile {
  file: File;
  type: 'image' | 'video';
  previewUrl: string;
  caption: string;
}

export default function EditCatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreated = searchParams.get("created") === "true";
  
  const [cat, setCat] = useState<CatDetail | null>(null);
  const [formData, setFormData] = useState<CatFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // アップロード用State
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchCat = async () => {
    const token = Cookies.get("access_token");
    if (!token) {
      router.push("/shelter/login");
      return;
    }

    try {
      const response = await api.get(`/api/cats/${params.id}/`);
      const catData = response.data;
      setCat(catData);
      setFormData({
        name: catData.name || "",
        gender: catData.gender || "unknown",
        age_years: catData.age_years || 0,
        age_months: catData.age_months || 0,
        breed: catData.breed || "",
        size: catData.size || "medium",
        color: catData.color || "",
        personality: catData.personality || "",
        health_status: catData.health_status || "",
        vaccination: catData.vaccination || false,
        neutered: catData.neutered || false,
        description: catData.description || "",
        status: catData.status || "open",
      });
    } catch (err: any) {
      console.error("Failed to fetch cat:", err);
      if (err.response?.status === 404) {
        router.push("/shelter/cats");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/shelter/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCat();
    if (isCreated) {
      setSuccessMessage("猫の登録が完了しました！写真をアップロードして情報を充実させましょう。");
    }
  }, [params.id, router, isCreated]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!formData) return;
    
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => prev ? { ...prev, [name]: checked } : null);
    } else if (type === "number") {
      setFormData((prev) => prev ? { ...prev, [name]: parseInt(value) || 0 } : null);
    } else {
      setFormData((prev) => prev ? { ...prev, [name]: value } : null);
    }
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setIsSaving(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const response = await api.patch(`/api/cats/${params.id}/`, formData);
      setCat(response.data);
      setSuccessMessage("情報を更新しました！");
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
        setErrors({ general: "更新に失敗しました。" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ファイル選択ハンドラ
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const previewUrl = URL.createObjectURL(file);
    
    setPendingFile({
      file,
      type,
      previewUrl,
      caption: '',
    });

    // 同じファイルを選択しても反応するようにリセット
    e.target.value = '';
  };

  // アップロード処理
  const processUpload = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    const formData = new FormData();
    
    if (pendingFile.type === 'image') {
      formData.append("image", pendingFile.file);
      formData.append("is_primary", (!cat?.images || cat.images.length === 0) ? "true" : "false");
    } else {
      formData.append("video", pendingFile.file);
    }
    
    // キャプション追加
    if (pendingFile.caption) {
      formData.append("caption", pendingFile.caption);
    }

    try {
      const endpoint = pendingFile.type === 'image' 
        ? `/api/cats/${params.id}/images/` 
        : `/api/cats/${params.id}/videos/`;
        
      await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      await fetchCat(); // 最新情報を再取得
      setSuccessMessage(`${pendingFile.type === 'image' ? '画像' : '動画'}をアップロードしました！`);
      cancelUpload(); // モーダルを閉じる
    } catch (err) {
      console.error("Upload failed:", err);
      setErrors({ upload: `${pendingFile.type === 'image' ? '画像' : '動画'}のアップロードに失敗しました。` });
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
  };

  if (isLoading || !formData) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] font-sans text-gray-900 relative">
      <Header />

      {/* アップロードモーダル */}
      {pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {pendingFile.type === 'image' ? '写真' : '動画'}のアップロード
              </h3>
              <button onClick={cancelUpload} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 aspect-video flex items-center justify-center">
                {pendingFile.type === 'image' ? (
                  <img src={pendingFile.previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <video src={pendingFile.previewUrl} controls className="max-h-full max-w-full" />
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  コメント（任意）
                </label>
                <input
                  type="text"
                  value={pendingFile.caption}
                  onChange={(e) => setPendingFile({...pendingFile, caption: e.target.value})}
                  placeholder="例：お気に入りの写真です！"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelUpload}
                  disabled={isUploading}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={processUpload}
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      送信中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      アップロード
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <span className="text-gray-800">{cat?.name}を編集</span>
          </div>

          {/* 成功メッセージ */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <span className="text-lg">✅</span>
              {successMessage}
            </div>
          )}

          {/* フォームカード */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
            <div className="flex items-center gap-4 mb-8">
              {cat?.primary_image ? (
                <img
                  src={cat.primary_image}
                  alt={cat.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-4xl">
                  🐱
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{cat?.name}を編集</h1>
                <p className="text-gray-500 text-sm">猫の情報を更新します</p>
              </div>
            </div>

            {/* メディア管理セクション */}
            <div className="mb-10 border-b border-gray-100 pb-10">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                写真・動画
              </h2>
              
              {/* エラー表示 */}
              {errors.upload && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {errors.upload}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* 既存の画像 */}
                {cat?.images && cat.images.map((img: CatImage) => (
                  <div key={`img-${img.id}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                    <img 
                      src={img.image_url || img.image} 
                      alt="Cat" 
                      className="w-full h-full object-cover"
                    />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                        <p className="text-white text-[10px] truncate text-center">{img.caption}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs">登録済み</span>
                    </div>
                  </div>
                ))}

                {/* 既存の動画 */}
                {cat?.videos && cat.videos.map((vid: CatVideo) => (
                  <div key={`vid-${vid.id}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-black group">
                    <video 
                      src={vid.video_url || vid.video} 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <VideoIcon className="w-8 h-8 text-white" />
                    </div>
                    {vid.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 z-10">
                        <p className="text-white text-[10px] truncate text-center">{vid.caption}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs">動画</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* アップロードボタン */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 画像アップロードボタン */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'image')}
                    ref={imageInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all group"
                  >
                    <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">写真を追加</span>
                    <span className="text-xs text-blue-400 mt-1">スマホのライブラリから選択</span>
                  </button>
                </div>

                {/* 動画アップロードボタン */}
                <div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e, 'video')}
                    ref={videoInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-pink-200 rounded-2xl flex flex-col items-center justify-center text-pink-500 hover:bg-pink-50 hover:border-pink-300 transition-all group"
                  >
                    <div className="bg-pink-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <VideoIcon className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">動画を追加</span>
                    <span className="text-xs text-pink-400 mt-1">スマホの動画を選択</span>
                  </button>
                </div>
              </div>
            </div>

            {/* エラーメッセージ */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* 性別 */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1.5">
                      性別
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

                  {/* 年齢 */}
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

                  {/* 品種・体格 */}
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
                    />
                  </div>

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
                    />
                  </div>
                </div>
              </div>

              {/* 性格・説明 */}
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">性格・説明</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-1.5">
                      性格
                    </label>
                    <textarea
                      id="personality"
                      name="personality"
                      value={formData.personality}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                      詳細説明
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 健康状態 */}
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">健康状態</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="health_status" className="block text-sm font-medium text-gray-700 mb-1.5">
                      健康状態
                    </label>
                    <textarea
                      id="health_status"
                      name="health_status"
                      value={formData.health_status}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    />
                  </div>

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
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {isSaving ? "保存中..." : "保存する"}
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
