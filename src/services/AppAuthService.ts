import {apiRequest} from './api';

export type AppLoginResponse = {
  access_token: string;
  token_type: string;
  role: string;
  full_name?: string;
};

type AppRegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  country?: string;
  language?: string;
};

export async function loginApp(email: string, password: string): Promise<AppLoginResponse> {
  return apiRequest<AppLoginResponse>('/api/app/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, password}),
  });
}

export async function registerApp(payload: AppRegisterPayload): Promise<AppLoginResponse> {
  return apiRequest<AppLoginResponse>('/api/app/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });
}
