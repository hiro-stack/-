import { CatFilters } from "@/types";
import { Search, X } from "lucide-react";
import { FC, ChangeEvent } from "react";

interface CatFilterProps {
  filters: CatFilters;
  onFilterChange: (filters: CatFilters) => void;
  onReset?: () => void;
}

const CatFilter: FC<CatFilterProps> = ({ filters, onFilterChange, onReset }) => {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined });
  };

  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      gender: value ? (value as CatFilters["gender"]) : undefined,
    });
  };

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      status: value ? (value as CatFilters["status"]) : undefined,
    });
  };

  const handleMinAgeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      min_age: value ? parseInt(value, 10) : undefined,
    });
  };

  const handleMaxAgeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      max_age: value ? parseInt(value, 10) : undefined,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.gender ||
    filters.status ||
    filters.min_age !== undefined ||
    filters.max_age !== undefined;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 shadow-lg border-2 border-[#f4a5b9]/20 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#5a5a6b]">絞り込み</h2>
        {hasActiveFilters && onReset && (
          <button
            onClick={onReset}
            className="flex items-center text-sm font-medium text-[#f4a5b9] hover:text-[#f28ea6] hover:bg-pink-50 px-2 py-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4 mr-1" />
            クリア
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Keyword Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            キーワード検索
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b9baa]" />
            <input
              id="search"
              type="text"
              placeholder="名前、品種で検索..."
              value={filters.search || ""}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            性別
          </label>
          <select
            id="gender"
            value={filters.gender || ""}
            onChange={handleGenderChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm bg-white"
          >
            <option value="">すべて</option>
            <option value="male">オス</option>
            <option value="female">メス</option>
            <option value="unknown">不明</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            募集状況
          </label>
          <select
            id="status"
            value={filters.status || ""}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm bg-white"
          >
            <option value="">すべて</option>
            <option value="open">募集中</option>
            <option value="trial">トライアル中</option>
            <option value="adopted">譲渡済み</option>
            <option value="in_review">審査中</option>
          </select>
        </div>

        {/* Age Range */}
        <div>
          <label className="block text-sm font-medium text-[#5a5a6b] mb-2">年齢（歳）</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="最小"
              min="0"
              max="20"
              value={filters.min_age !== undefined ? filters.min_age : ""}
              onChange={handleMinAgeChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm placeholder:text-gray-400"
            />
            <span className="text-[#9b9baa]">〜</span>
            <input
              type="number"
              placeholder="最大"
              min="0"
              max="20"
              value={filters.max_age !== undefined ? filters.max_age : ""}
              onChange={handleMaxAgeChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatFilter;
