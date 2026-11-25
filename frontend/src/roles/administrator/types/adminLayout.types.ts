export interface AdminMenuItem { to: string; end?: boolean; label: string; icon: string; badge?: string }
export interface AdminTopBarProps { onSearch?: (query: string) => void; title?: string }
