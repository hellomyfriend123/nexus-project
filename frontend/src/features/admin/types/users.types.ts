import type { UserStatus, OrderStatus, CampaignStatus } from './admin.types';
export interface DetailedAdminUser {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  phone?: string;
  phoneNumber?: string;
  identityNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  role?: string;
  roles?: string[];
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  totalOrders?: number;
  totalSpent?: number;
  notes?: string;
}
