import {buildApiUrl} from '../config/appConfig';

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
  const response = await fetch(buildApiUrl('/api/app/auth/login'), {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, password}),
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail = typeof payload?.detail === 'string' ? payload.detail : 'Login failed';
    throw new Error(detail);
  }

  return payload as AppLoginResponse;
}

export async function registerApp(payload: AppRegisterPayload): Promise<AppLoginResponse> {
  const response = await fetch(buildApiUrl('/api/app/auth/register'), {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : 'Registration failed';
    throw new Error(detail);
  }
  return data as AppLoginResponse;
}
