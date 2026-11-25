import { useState, type FormEvent } from 'react';
import { useAdminLayoutSession } from './useAdminLayoutSession';
export function useAdminTopBar(onSearch?: (query: string) => void) {
  const [query, setQuery] = useState('');
  const session = useAdminLayoutSession();
  const handleSearch = (event: FormEvent) => { event.preventDefault(); onSearch?.(query); };
  return { query, setQuery, handleSearch, ...session };
}
