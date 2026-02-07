import { FC } from "react";

const SearchHero: FC = () => {
  return (
    <header className="bg-white border-b border-[#f4a5b9]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#5a5a6b]">
            保護猫を探す
          </h1>
          <p className="text-sm sm:text-base text-[#9b9baa] max-w-xl mx-auto">
            あなたの家族になる猫を見つけましょう
          </p>
        </div>
      </div>
    </header>
  );
};

export default SearchHero;
