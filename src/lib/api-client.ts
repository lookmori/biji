/** API 客户端 — 所有后端请求的统一入口 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface Folder {
  id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  children: Folder[];
  created_at: string;
}

export interface Note {
  id: string;
  folder_id: string | null;
  title: string;
  excerpt?: string;
  content?: string;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  canvasTypes: string[];
  created_at: string;
  updated_at: string;
}

export interface CanvasRecord {
  canvas_type: string;
  canvas_data: any;
  preview_image_url: string;
  panel_status: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "请求失败");
  return data;
}

// ---- Auth ----
export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string }) =>
      request<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

    logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

    me: () => request<{ user: User | null }>("/api/auth/me"),
  },

  // ---- Folders ----
  folders: {
    list: () => request<{ folders: Folder[] }>("/api/folders"),

    create: (body: { name: string; parentId?: string }) =>
      request<{ folder: Folder }>("/api/folders", { method: "POST", body: JSON.stringify(body) }),

    update: (body: { id: string; name?: string; parentId?: string }) =>
      request<{ folder: Folder }>("/api/folders", { method: "PUT", body: JSON.stringify(body) }),

    delete: (id: string) =>
      request<{ ok: boolean }>("/api/folders", { method: "DELETE", body: JSON.stringify({ id }) }),
  },

  // ---- Notes ----
  notes: {
    list: (params?: { folderId?: string; favorite?: boolean; search?: string; deleted?: boolean; page?: number; pageSize?: number }) => {
      const sp = new URLSearchParams();
      if (params?.folderId) sp.set("folderId", params.folderId);
      if (params?.favorite) sp.set("favorite", "true");
      if (params?.search) sp.set("search", params.search);
      if (params?.deleted) sp.set("deleted", "true");
      if (params?.page) sp.set("page", String(params.page));
      if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
      return request<{ notes: Note[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(`/api/notes?${sp.toString()}`);
    },

    get: (id: string) => request<{ note: Note; canvasRecords: CanvasRecord[] }>(`/api/notes/${id}`),

    create: (body: { title?: string; content?: string; folderId?: string }) =>
      request<{ note: Note }>("/api/notes", { method: "POST", body: JSON.stringify(body) }),

    update: (id: string, body: Partial<Note>) =>
      request<{ note: Note }>(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify(body) }),

    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/notes/${id}`, { method: "DELETE" }),
  },

  // ---- Canvas ----
  canvas: {
    get: (noteId: string, type: string) =>
      request<{ record: CanvasRecord | null }>(`/api/canvas/${noteId}?type=${type}`),

    save: (noteId: string, body: { canvasType: string; canvasData?: any; previewImageUrl?: string; panelStatus?: string }) =>
      request<{ record: CanvasRecord }>(`/api/canvas/${noteId}`, { method: "PUT", body: JSON.stringify(body) }),

    delete: (noteId: string, canvasType: string) =>
      request<{ ok: boolean }>(`/api/canvas/${noteId}`, { method: "DELETE", body: JSON.stringify({ canvasType }) }),
  },
};
