"use client";

import { useState } from "react";
import useSWR from "swr";
import { catsService } from "@/services/cats";
import { CatFilters, CatList } from "@/types";
import Header from "@/components/common/Header";
import SearchHero from "@/components/sections/SearchHero";
import CatFilter from "@/components/cats/CatFilter";
import CatCard from "@/components/cats/CatCard";
import Footer from "@/components/common/Footer";

export default function Home() {
  const [filters, setFilters] = useState<CatFilters>({});

  // Use SWR for data fetching with filters
  const { data, error, isLoading } = useSWR(
    ['/api/cats', filters],
    ([_, f]) => catsService.getCats(f)
  );

  const cats = data?.results || [];
  const totalCount = data?.count || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
      <Header />
      
      <main className="pt-16">
        <SearchHero />
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Filter Panel */}
            <aside className="w-full lg:w-80 flex-shrink-0">
              <CatFilter 
                filters={filters} 
                onFilterChange={setFilters} 
                onReset={() => setFilters({})}
              />
            </aside>

            {/* Right Column: Search Results */}
            <div className="flex-1">
              <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-2">
                <h2 className="text-lg font-medium text-gray-700">
                  {isLoading ? (
                    <span className="animate-pulse bg-gray-200 text-transparent rounded">Loading...</span>
                  ) : (
                    `${totalCount}件の保護猫が見つかりました`
                  )}
                </h2>
              </div>

              {isLoading ? (
                // Loading Skeleton
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm h-96 animate-pulse p-4">
                      <div className="bg-gray-200 h-48 rounded-xl mb-4 w-full" />
                      <div className="bg-gray-200 h-6 w-3/4 rounded mb-2" />
                      <div className="bg-gray-200 h-4 w-1/2 rounded" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-center">
                  データの取得に失敗しました。しばらく経ってから再度お試しください。
                </div>
              ) : cats.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cats.map((cat) => (
                    <CatCard key={cat.id} cat={cat} />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-lg">
                    条件に一致する保護猫は見つかりませんでした。
                  </p>
                  <button 
                    onClick={() => setFilters({})} 
                    className="mt-4 text-pink-500 font-medium hover:underline"
                  >
                    条件をクリアする
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-white text-pink-500 rounded-full shadow-lg flex items-center justify-center hover:bg-pink-50 transition-colors border border-pink-100 z-50">
        <span className="text-2xl font-bold">?</span>
      </button>
    </div>
  );
}
