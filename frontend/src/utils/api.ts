const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  tailwindConfig?: string;
  createdAt: string;
}

export interface ComponentProp {
  name: string;
  type: string;
  defaultValue?: string;
  required: boolean;
  description?: string;
}

export interface ComponentItem {
  id: string;
  projectId: string;
  name: string;
  description: string;
  code: string;
  props: ComponentProp[];
  createdAt: string;
  updatedAt: string;
}

// Token helper
export const tokenStorage = {
  getToken: () => typeof window !== 'undefined' ? localStorage.getItem('hub_auth_token') : null,
  setToken: (token: string) => typeof window !== 'undefined' && localStorage.setItem('hub_auth_token', token),
  clearToken: () => typeof window !== 'undefined' && localStorage.removeItem('hub_auth_token'),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  register: async (username: string, email: string, password: string) => {
    const data = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    tokenStorage.setToken(data.token);
    return data;
  },

  login: async (usernameOrEmail: string, password: string) => {
    const data = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    tokenStorage.setToken(data.token);
    return data;
  },

  getMe: async () => {
    return request<{ user: User }>('/auth/me');
  },

  logout: () => {
    tokenStorage.clearToken();
  },

  forgotPassword: async (email: string) => {
    return request<{ message: string; email: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

  // Projects
  getProjects: async () => {
    return request<{ projects: Project[] }>('/projects');
  },

  getMyProjects: async () => {
    return request<{ projects: Project[] }>('/projects/my');
  },

  getProject: async (id: string) => {
    return request<{ project: Project }>(`/projects/${id}`);
  },

  createProject: async (name: string, description: string, isPublic: boolean, tailwindConfig?: string) => {
    return request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description, isPublic, tailwindConfig }),
    });
  },

  updateProject: async (id: string, updates: Partial<Omit<Project, 'id' | 'ownerId' | 'createdAt'>>) => {
    return request<{ project: Project }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteProject: async (id: string) => {
    return request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Components
  getComponents: async (projectId: string) => {
    return request<{ components: ComponentItem[] }>(`/projects/${projectId}/components`);
  },

  getComponent: async (id: string) => {
    return request<{ component: ComponentItem }>(`/components/${id}`);
  },

  createComponent: async (projectId: string, name: string, description: string, code: string, props?: ComponentProp[]) => {
    return request<{ component: ComponentItem }>(`/projects/${projectId}/components`, {
      method: 'POST',
      body: JSON.stringify({ name, description, code, props }),
    });
  },

  updateComponent: async (id: string, updates: { name?: string; description?: string; code?: string; props?: ComponentProp[]; autoParse?: boolean }) => {
    return request<{ component: ComponentItem }>(`/components/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteComponent: async (id: string) => {
    return request<{ message: string }>(`/components/${id}`, {
      method: 'DELETE',
    });
  },

  // Parser
  parseCode: async (code: string) => {
    return request<{ props: ComponentProp[] }>('/parse-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }
};
