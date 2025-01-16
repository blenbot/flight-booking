import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes';
import { AuthProvider } from '@/context/auth-context';
import './app.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
