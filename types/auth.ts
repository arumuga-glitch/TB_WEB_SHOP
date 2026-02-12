import { User } from "@/store/authStore";

export interface AuthResponse {
  isNewUser: boolean;
  id?: string;
  user?: User | null;
  accessToken?: string | null;
  expiresIn?: number | null;
  tokenType?: string | null;
}