import { createContext, ReactNode, useContext, useState } from "react";

export type SearchFilters = {
  poliKeys: string[];
  jarakMaksimal: number; // km
  ratingMinimum: number;
  bukaSekarang: boolean;
  buka24Jam: boolean;
  menerimaBpjs: boolean;
};

const DEFAULT_FILTERS: SearchFilters = {
  poliKeys: [],
  jarakMaksimal: 20,
  ratingMinimum: 0,
  bukaSekarang: false,
  buka24Jam: false,
  menerimaBpjs: false,
};

type SearchFilterContextType = {
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  resetFilters: () => void;
};

const SearchFilterContext = createContext<SearchFilterContextType | undefined>(
  undefined,
);

export function SearchFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <SearchFilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </SearchFilterContext.Provider>
  );
}

export function useSearchFilters() {
  const context = useContext(SearchFilterContext);
  if (!context)
    throw new Error(
      "useSearchFilters harus dipakai di dalam <SearchFilterProvider>",
    );
  return context;
}
