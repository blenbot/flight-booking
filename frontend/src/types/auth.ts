export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface LoginResponse {
  user: User;
  token: string;
}
  
export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}