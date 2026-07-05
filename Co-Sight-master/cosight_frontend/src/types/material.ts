export type MaterialKind = 'upload' | 'generated' | 'report' | 'process';

export type MaterialItem = {
  id: string;
  name: string;
  kind: MaterialKind;
  source: 'upload' | 'workspace';
  createdAt: string;
  sizeMb?: number;
  workspacePath?: string;
  uploadId?: string;
  userAccount?: string;
  taskId?: string;
  taskTitle?: string;
  downloadUrl?: string;
};

export type MaterialLibrary = {
  items: MaterialItem[];
  stats: {
    total: number;
    uploads: number;
    generated: number;
    reports: number;
    process?: number;
  };
};

export type MaterialLibraryApiResponse = {
  code: number;
  data?: MaterialLibrary;
  message?: string;
};

export type MaterialTaskRegistration = {
  userAccount: string;
  taskId: string;
  taskTitle?: string;
  scenario?: string;
  workspacePath: string;
  uploadIds?: string[];
};
