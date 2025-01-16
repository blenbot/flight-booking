export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
  }
  
  export interface LoginResponse {
    user: User;
    token: string;
  }