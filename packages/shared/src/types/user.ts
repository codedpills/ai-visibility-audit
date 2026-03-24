export type UserPlan = 'free' | 'pro';

export interface User {
  id: string;
  email: string;
  plan: UserPlan;
  createdAt: string;
}
