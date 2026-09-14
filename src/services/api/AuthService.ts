import api from './client';

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface AuthUser {
  id?: number | string;
  email?: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
}

export interface GoogleSignInResponse extends LoginResponse {
  user?: AuthUser;
}

export type AuthMessageResponse = {
  detail?: string;
  message?: string;
};

export type EmailRegistrationVerifyResponse = Partial<LoginResponse> & {
  user?: AuthUser;
};

const assertTokenResponse = <T extends LoginResponse>(
  response: T,
  source: string,
): T => {
  if (!response?.access || !response?.refresh) {
    throw new Error(`${source} did not return access and refresh tokens.`);
  }
  return response;
};

export const AuthService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/token/', { email, password });
    return assertTokenResponse(response.data, 'Password login');
  },

  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register/', { email, password });
    return response.data;
  },

  registerWithEmail: async (
    email: string,
    password: string,
  ): Promise<AuthMessageResponse> => {
    const response = await api.post<AuthMessageResponse>(
      '/auth/email/register/',
      { email, password },
    );
    return response.data;
  },

  resendEmailVerification: async (
    email: string,
  ): Promise<AuthMessageResponse> => {
    const response = await api.post<AuthMessageResponse>(
      '/auth/email/resend/',
      { email },
    );
    return response.data;
  },

  verifyEmailRegistration: async (
    email: string,
    code: string,
  ): Promise<EmailRegistrationVerifyResponse> => {
    const response = await api.post<EmailRegistrationVerifyResponse>(
      '/auth/email/verify/',
      {
        email,
        code,
        uid: email,
        token: code,
      },
    );
    return response.data;
  },

  requestPasswordReset: async (
    email: string,
  ): Promise<AuthMessageResponse> => {
    const response = await api.post<AuthMessageResponse>(
      '/auth/password-reset/request/',
      { email },
    );
    return response.data;
  },

  confirmPasswordReset: async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<AuthMessageResponse> => {
    const response = await api.post<AuthMessageResponse>(
      '/auth/password-reset/confirm/',
      {
        email,
        code,
        uid: email,
        token: code,
        new_password: newPassword,
        password_confirm: newPassword,
      },
    );
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await api.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/auth/delete-account/');
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await api.post('/auth/password-change/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  refreshToken: async (refresh: string) => {
    const response = await api.post('/auth/token/refresh/', { refresh });
    return response.data;
  },

  googleSignIn: async (idToken: string): Promise<GoogleSignInResponse> => {
    const response = await api.post<GoogleSignInResponse>('/auth/google/', { id_token: idToken });
    return assertTokenResponse(response.data, 'Google sign-in');
  },

  firebaseAuth: async (token: string) => {
    const response = await api.post('/auth/firebase/', { token });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/profile/');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.patch('/profile/', data);
    return response.data;
  },
};
