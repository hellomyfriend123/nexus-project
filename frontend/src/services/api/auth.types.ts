export type AuthRole = 'buyer' | 'seller';
export interface LoginInput { identifier: string; password: string; role: AuthRole; }
export interface MeResponse { userId: string; username?: string; email: string; fullName: string; roles: string[]; status: string; }
export interface LoginResponse extends Omit<MeResponse, 'status'> { accessToken: string; tokenType: string; expiresAt: string; }
export interface RegisterInput { username: string; fullName: string; email: string; phone: string; password: string; confirmPassword: string; role: AuthRole; }
export type RegisterErrors = Partial<Record<Exclude<keyof RegisterInput, 'role'>, string>>;
