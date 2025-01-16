export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "admin" | "customer";
  created_at: Date;
}
