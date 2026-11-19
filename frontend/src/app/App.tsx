import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const mode = params.get('mode');
  const category = params.get('categoryId');
  // Screen changes start at the top; typing a search query stays in place.
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [pathname, mode, category]);
  return <AppRoutes />;
}
