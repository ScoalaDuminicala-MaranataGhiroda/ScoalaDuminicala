import { AuthProvider } from '@/contexts/AuthContext';
import AppRouter from '@/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
