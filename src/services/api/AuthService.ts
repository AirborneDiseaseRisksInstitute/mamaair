import api from './client';

export interface LoginResponse {
  access: string;
  refresh: string;
}

export const AuthService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/token/', { email, password });
    return response.data;
  },

  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register/', { email, password });
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

  googleSignIn: async (idToken: string) => {
    const response = await api.post('/auth/google/', { id_token: idToken });
    return response.data;
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
