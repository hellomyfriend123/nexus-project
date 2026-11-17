export class AuthApiError extends Error {
  constructor(public status: number, message: string, public details: { field: string; message: string }[] = []) {
    super(message); this.name = 'AuthApiError';
  }
}
