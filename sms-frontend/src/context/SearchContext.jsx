import { createContext, useContext } from 'react';

export const SearchContext = createContext({ searchQuery: '', setSearchQuery: () => {} });

export function useSearch() {
  return useContext(SearchContext);
}
