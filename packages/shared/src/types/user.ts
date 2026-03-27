export type UserPlan = 'free' | 'pro';

export interface User {
  id: string;
  email: string;
  plan: UserPlan;
  auditsThisMonth: number;
  monthlyLimit: number;
  monthResetAt: string;
  donated: boolean;
  donationPoints: number;
  createdAt: string;
}
