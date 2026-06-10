import { 
  Asset, 
  SIMContract, 
  Employee, 
  AssignmentHistory, 
  SystemDocument, 
  ActivityLog, 
  SystemNotification,
  DashboardStats 
} from '../types';

const API_BASE = '/api';

export class ApiService {
  // Helper for generic requests
  private static async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || errBody.message || `API error (Status ${response.status})`);
    }

    return response.json() as Promise<T>;
  }

  // --- Auth API ---
  public static async login(username: string, password: string): Promise<{ success: boolean; user: { username: string; role: 'admin' | 'user' } }> {
    return this.request<{ success: boolean; user: { username: string; role: 'admin' | 'user' } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  public static async getCurrentUser(): Promise<{ user: { username: string; role: 'admin' | 'user' } | null }> {
    return this.request<{ user: { username: string; role: 'admin' | 'user' } | null }>('/auth/current');
  }

  public static async logout(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }

  // --- Stats api ---
  public static async getStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/stats');
  }

  // --- Assets Api ---
  public static async getAssets(search = ''): Promise<Asset[]> {
    return this.request<Asset[]>(`/assets?search=${encodeURIComponent(search)}`);
  }

  public static async getAsset(id: string): Promise<Asset & { history: AssignmentHistory[]; currentAssignment: AssignmentHistory | null }> {
    return this.request<Asset & { history: AssignmentHistory[]; currentAssignment: AssignmentHistory | null }>(`/assets/${id}`);
  }

  public static async createAsset(asset: Omit<Asset, 'isDeleted' | 'qrCode'>): Promise<Asset> {
    return this.request<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    });
  }

  public static async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public static async deleteAsset(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Contracts API ---
  public static async getContracts(search = ''): Promise<SIMContract[]> {
    return this.request<SIMContract[]>(`/contracts?search=${encodeURIComponent(search)}`);
  }

  public static async getContract(phone: string): Promise<SIMContract & { history: AssignmentHistory[]; linkedAsset: Asset | null }> {
    return this.request<SIMContract & { history: AssignmentHistory[]; linkedAsset: Asset | null }>(`/contracts/${phone}`);
  }

  public static async createContract(contract: Omit<SIMContract, 'isDeleted'>): Promise<SIMContract> {
    return this.request<SIMContract>('/contracts', {
      method: 'POST',
      body: JSON.stringify(contract),
    });
  }

  public static async updateContract(phone: string, updates: Partial<SIMContract>): Promise<SIMContract> {
    return this.request<SIMContract>(`/contracts/${phone}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public static async deleteContract(phone: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/contracts/${phone}`, {
      method: 'DELETE',
    });
  }

  // --- Employees API ---
  public static async getEmployees(search = ''): Promise<Employee[]> {
    return this.request<Employee[]>(`/employees?search=${encodeURIComponent(search)}`);
  }

  public static async getEmployee(id: string): Promise<Employee & { history: AssignmentHistory[]; activeEquipments: AssignmentHistory[] }> {
    return this.request<Employee & { history: AssignmentHistory[]; activeEquipments: AssignmentHistory[] }>(`/employees/${id}`);
  }

  public static async createEmployee(employee: Omit<Employee, 'isDeleted'>): Promise<Employee> {
    return this.request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  }

  public static async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public static async deleteEmployee(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Handover / Assignment API ---
  public static async getAssignments(search = ''): Promise<AssignmentHistory[]> {
    return this.request<AssignmentHistory[]>(`/assignments?search=${encodeURIComponent(search)}`);
  }

  public static async assignDevice(data: {
    employeeId: string;
    assetId: string;
    phoneNumber: string | null;
    notes: string;
    assignmentDate: string;
  }): Promise<AssignmentHistory> {
    return this.request<AssignmentHistory>('/assignments/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async returnDevice(data: {
    assignmentId: string;
    notes: string;
    returnDate: string;
  }): Promise<AssignmentHistory> {
    return this.request<AssignmentHistory>('/assignments/return', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Documents API ---
  public static async getDocuments(): Promise<SystemDocument[]> {
    return this.request<SystemDocument[]>('/documents');
  }

  public static async uploadDocument(data: {
    name: string;
    base64: string; // Base64 dataURL
    fileType: SystemDocument['fileType'];
    linkedType: SystemDocument['linkedType'];
    linkedId: string | null;
  }): Promise<SystemDocument> {
    return this.request<SystemDocument>('/documents/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async deleteDocument(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Logs & Notifications API ---
  public static async getLogs(): Promise<ActivityLog[]> {
    return this.request<ActivityLog[]>('/logs');
  }

  public static async getNotifications(): Promise<SystemNotification[]> {
    return this.request<SystemNotification[]>('/notifications');
  }

  public static async triggerNotificationAuditCheck(): Promise<{ success: boolean; count: number; notifications: SystemNotification[] }> {
    return this.request<{ success: boolean; count: number; notifications: SystemNotification[] }>('/notifications/check-jobs', {
      method: 'POST',
    });
  }

  public static async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  public static async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    });
  }
}

// Convert files to base64 helper
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
