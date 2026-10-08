export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Role = "DONOR" | "ORGANIZER" | "ADMIN";
export type UserStatus = "ACTIVE" | "LOCKED" | "DELETED";

export interface User {
  id: string;
  name: string;
  email: string;
  phonenumber: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: {
    campaigns: number;
    donations: number;
  };
}

export interface UserPage {
  items: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CampaignImage {
  id: string;
  objectName: string;
  mimeType: string;
  size: number;
  position: number;
  url: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  target: string | number;
  current: string | number;
  status: string;
  progressPercent?: number;
  category?: { name: string } | null;
  creator?: { name: string };
  images?: CampaignImage[];
}

export interface Payment {
  id: string;
  reference: string;
  amount: string | number;
  status: string;
  createdAt: string;
  paidAt?: string | null;
  donation: {
    status: string;
    campaign: { id: string; title: string };
    donor?: { name: string };
  };
}

export async function api<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...options } = init;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    throw new Error(
      Array.isArray(body?.message)
        ? body.message.join(", ")
        : (body?.message ?? "Khong the ket noi may chu."),
    );
  }
  return response.json() as Promise<T>;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  token?: string | null,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    throw new Error(
      Array.isArray(body?.message)
        ? body.message.join(", ")
        : (body?.message ?? "Khong the ket noi may chu."),
    );
  }
  return response.json() as Promise<T>;
}

export async function getCampaignImages(
  campaignId: string,
): Promise<CampaignImage[]> {
  return api<CampaignImage[]>(`/campaign/${campaignId}/images`);
}

export async function uploadCampaignImages(
  campaignId: string,
  images: File[],
  token: string,
): Promise<CampaignImage[]> {
  const formData = new FormData();
  images.forEach((image) => {
    formData.append("images", image);
  });
  return apiUpload<CampaignImage[]>(
    `/campaign/${campaignId}/images`,
    formData,
    token,
  );
}

export async function deleteCampaignImage(
  campaignId: string,
  imageId: string,
  token: string,
): Promise<{ success: boolean }> {
  return api<{ success: boolean }>(
    `/campaign/${campaignId}/images/${imageId}`,
    {
      method: "DELETE",
      token,
    },
  );
}

// User management APIs
export async function fetchUsers(
  token: string,
  query?: { search?: string; role?: Role; page?: number; limit?: number },
): Promise<UserPage> {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.role) params.set("role", query.role);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  return api<UserPage>(`/user/admin${params.toString() ? `?${params}` : ""}`, {
    token,
  });
}

export async function fetchUser(id: string, token: string): Promise<User> {
  return api<User>(`/user/admin/${id}`, { token });
}

export async function updateUserRole(
  id: string,
  role: Role,
  token: string,
): Promise<User> {
  return api<User>(`/user/admin/${id}/role`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ role }),
  });
}

export async function lockUser(id: string, token: string): Promise<User> {
  return api<User>(`/user/admin/${id}/lock`, {
    method: "PATCH",
    token,
  });
}

export async function unlockUser(id: string, token: string): Promise<User> {
  return api<User>(`/user/admin/${id}/unlock`, {
    method: "PATCH",
    token,
  });
}

export async function deleteUser(id: string, token: string): Promise<User> {
  return api<User>(`/user/admin/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function registerUser(
  data: {
    name: string;
    email: string;
    phonenumber: string;
    password: string;
    role: Role;
  },
  token: string,
): Promise<User> {
  return api<User>(
    "/user/admin/register",
    {
      method: "POST",
      token,
      body: JSON.stringify(data),
    },
  );
}

// Admin campaign review APIs
export interface AdminCampaign {
  id: string;
  title: string;
  description: string;
  target: string | number;
  current: string | number;
  status: string;
  createdAt: string;
  category: { id: string; name: string } | null;
  creator: { id: string; name: string; email: string };
  _count: {
    donations: number;
    updates: number;
  };
}

export interface CampaignPage {
  items: AdminCampaign[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchAdminCampaigns(
  token: string,
  query?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
): Promise<CampaignPage> {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  return api<CampaignPage>(`/admin/campaigns${params.toString() ? `?${params}` : ""}`, {
    token,
  });
}

export async function approveCampaign(
  id: string,
  reviewNote: string | undefined,
  token: string,
): Promise<AdminCampaign> {
  return api<AdminCampaign>(`/campaign/${id}/approve`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ reviewNote }),
  });
}

export async function rejectCampaign(
  id: string,
  reviewNote: string,
  token: string,
): Promise<AdminCampaign> {
  return api<AdminCampaign>(`/campaign/${id}/reject`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ reviewNote }),
  });
}

export const money = (value: string | number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value),
  );
export const dateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";
