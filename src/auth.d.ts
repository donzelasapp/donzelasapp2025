import { User } from '@supabase/supabase-js';
import { Profile } from './types/profile';

export interface AuthContextType {
  user: User | null;
  userProfile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: any) => void;
  saveUserProfile: (userId: string, profileData: any) => Promise<any>;
} 