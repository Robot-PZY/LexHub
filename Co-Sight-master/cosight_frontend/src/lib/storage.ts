const AUTH_KEY = 'fashu:demoAuth';
const AUTH_ROLE_KEY = 'lexhub:authRole';
const DEMO_USER_KEY = 'lexhub:demoUser';
const DRAFT_KEY = 'fashu:workspaceDraft';
const LAST_STEP_KEY = 'cosight:lastManusStep';
const PENDING_KEY = 'cosight:pendingRequests';
const PLAN_MAP_KEY = 'cosight:planIdByTopic';
const WS_CLIENT_KEY = 'cosight:wsClientKey';
const ADMIN_CONFIG_KEY = 'lexhub:adminConfig';
const MEMBERSHIP_USERS_KEY = 'lexhub:membershipUsers';
const REGISTERED_USERS_KEY = 'lexhub:registeredUsers';
const ADMIN_SESSION_KEY = 'lexhub:adminSession';
const BOUND_REPLAY_EVENT_KEY = 'lexhub:boundReplayEvent';

import type { AdminSettings } from '../types/admin-config';
import type { MembershipTier, MembershipUser } from '../types/membership';
import type { ReplayWorkspace } from '../types/replay';
import { DEMO_SEED_VERSION, DEMO_USER_ACCOUNT, DEMO_USER_DISPLAY_NAME, DEMO_USER_PASSWORD, ADMIN_DISPLAY_NAME } from '../mocks/demo-seed';
import { mockMembershipUsers } from '../mocks/membership-users';

const DEMO_SEED_VERSION_KEY = 'lexhub:demoSeedVersion';

export type AdminConfig = Partial<AdminSettings>;

export type PendingMessageRecord = {
  message: unknown;
  savedAt: number;
  stillPending: boolean;
};

type PlanMapRecord = {
  planId: string;
  stillPending: boolean;
  completed: boolean;
};

export function isAuthed(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'ok';
}

export function markAuthed(): void {
  localStorage.setItem(AUTH_KEY, 'ok');
}

export type AuthRole = 'user' | 'admin';

export function markAuthedRole(role: AuthRole): void {
  markAuthed();
  localStorage.setItem(AUTH_ROLE_KEY, role);
}

export function getAuthedRole(): AuthRole {
  return localStorage.getItem(AUTH_ROLE_KEY) === 'admin' ? 'admin' : 'user';
}

const ADMIN_ACCOUNT = 'Admin';
const ADMIN_PASSWORD = '123456';

export function getAdminAccount(): string {
  return ADMIN_ACCOUNT;
}

export type AdminSession = {
  account: string;
  displayName: string;
  loggedInAt: number;
};

export function loginAdmin(account: string = ADMIN_ACCOUNT): void {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
    account: account.trim() || ADMIN_ACCOUNT,
    displayName: ADMIN_DISPLAY_NAME,
    loggedInAt: Date.now(),
  } satisfies AdminSession));
  mergeCuratedMembershipUsers();
}

export function loadAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function isReservedAdminAccount(account: string): boolean {
  return account.trim().toLowerCase() === ADMIN_ACCOUNT.toLowerCase();
}

export function validateAdminLogin(account: string, password: string): boolean {
  return account.trim() === ADMIN_ACCOUNT && password === ADMIN_PASSWORD;
}

export function validateUserLogin(account: string, password: string): boolean {
  const trimmed = account.trim();
  if (trimmed === DEMO_USER_ACCOUNT && password === DEMO_USER_PASSWORD) return true;
  return loadRegisteredUsers().some((user) => user.account === trimmed && user.password === password);
}

export type RegisteredUser = {
  account: string;
  password: string;
  name: string;
  organization?: string;
  createdAt: number;
};

export function loadRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? (JSON.parse(raw) as RegisteredUser[]) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: RegisteredUser[]): void {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

export function isAccountTaken(account: string): boolean {
  const trimmed = account.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed === DEMO_USER_ACCOUNT.toLowerCase()) return true;
  if (trimmed === ADMIN_ACCOUNT.toLowerCase()) return true;
  return loadRegisteredUsers().some((user) => user.account.toLowerCase() === trimmed)
    || loadMembershipUsers().some((user) => user.account.toLowerCase() === trimmed);
}

export function registerUser(input: {
  account: string;
  password: string;
  name?: string;
  organization?: string;
}): { ok: true } | { ok: false; error: string } {
  const account = input.account.trim();
  const password = input.password;
  const name = input.name?.trim() || account;

  if (!account) return { ok: false, error: '请输入账号。' };
  if (account.length < 3) return { ok: false, error: '账号至少 3 个字符。' };
  if (!password) return { ok: false, error: '请输入密码。' };
  if (password.length < 6) return { ok: false, error: '密码至少 6 位。' };
  if (isReservedAdminAccount(account)) return { ok: false, error: '该账号不可注册，请更换。' };
  if (isAccountTaken(account)) return { ok: false, error: '账号已存在，请直接登录。' };

  const users = loadRegisteredUsers();
  users.push({
    account,
    password,
    name,
    organization: input.organization?.trim() || undefined,
    createdAt: Date.now(),
  });
  saveRegisteredUsers(users);
  upsertMembershipUser({ name, account, organization: input.organization, tier: 'trial' });
  saveDemoUser({ name, account, organization: input.organization, membershipTier: 'trial' });
  return { ok: true };
}

export function isDemoUserAccount(account: string): boolean {
  return account.trim() === DEMO_USER_ACCOUNT;
}

export function loginDemoUser(): void {
  saveDemoUser({
    name: DEMO_USER_DISPLAY_NAME,
    account: DEMO_USER_ACCOUNT,
    organization: '律枢开发演示账号',
    membershipTier: 'ultra',
  });
}

export type DemoUserProfile = {
  name: string;
  account: string;
  organization?: string;
  membershipTier?: MembershipTier;
  createdAt: number;
};

export function loadDemoUser(): DemoUserProfile | null {
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    return raw ? (JSON.parse(raw) as DemoUserProfile) : null;
  } catch {
    return null;
  }
}

export function getCurrentMembershipTier(): MembershipTier {
  const profile = loadDemoUser();
  if (profile?.membershipTier) return profile.membershipTier;
  if (profile?.account) {
    const matched = loadMembershipUsers().find((user) => user.account === profile.account);
    if (matched) return matched.tier;
  }
  return 'trial';
}

export function seedMembershipUsersIfEmpty(): void {
  const existing = loadMembershipUsers();
  if (existing.length > 0) return;
  saveMembershipUsers(mockMembershipUsers);
}

export function mergeCuratedMembershipUsers(): MembershipUser[] {
  const existing = loadMembershipUsers();
  const curatedByAccount = new Map(mockMembershipUsers.map((user) => [user.account, user]));
  const accounts = new Set(existing.map((user) => user.account));
  const missing = mockMembershipUsers.filter((user) => !accounts.has(user.account));
  const synced = existing.map((user) => {
    const curated = curatedByAccount.get(user.account);
    if (!curated) return user;
    return {
      ...user,
      createdAt: curated.createdAt,
      tier: curated.tier,
      status: curated.status,
      organization: curated.organization,
      lastActiveAt: curated.lastActiveAt,
    };
  });
  if (missing.length === 0 && synced.every((user, index) => user.createdAt === existing[index]?.createdAt)) {
    return existing;
  }
  const merged = [...synced, ...missing].sort(
    (a, b) => (b.lastActiveAt ?? b.createdAt) - (a.lastActiveAt ?? a.createdAt),
  );
  saveMembershipUsers(merged);
  return merged;
}

export function resetMembershipToSeed(): MembershipUser[] {
  saveMembershipUsers(mockMembershipUsers);
  localStorage.setItem(DEMO_SEED_VERSION_KEY, String(DEMO_SEED_VERSION));
  return mockMembershipUsers;
}

export function resetDemoRuntimeData(options?: { clearProfile?: boolean }): void {
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(LAST_STEP_KEY);
  localStorage.removeItem(PENDING_KEY);
  localStorage.removeItem(PLAN_MAP_KEY);
  sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
  sessionStorage.removeItem(PENDING_TASK_KEY);
  if (options?.clearProfile) {
    localStorage.removeItem(DEMO_USER_KEY);
  }
  resetMembershipToSeed();
}

export function ensureDemoSeedVersion(): boolean {
  const current = localStorage.getItem(DEMO_SEED_VERSION_KEY);
  if (current === String(DEMO_SEED_VERSION)) return false;
  resetMembershipToSeed();
  localStorage.removeItem(DEMO_USER_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  return true;
}

export function loadMembershipUsers(): MembershipUser[] {
  try {
    const raw = localStorage.getItem(MEMBERSHIP_USERS_KEY);
    return raw ? (JSON.parse(raw) as MembershipUser[]) : [];
  } catch {
    return [];
  }
}

export function saveMembershipUsers(users: MembershipUser[]): void {
  localStorage.setItem(MEMBERSHIP_USERS_KEY, JSON.stringify(users));
}

export function upsertMembershipUser(input: {
  name: string;
  account: string;
  organization?: string;
  tier?: MembershipTier;
}): MembershipUser {
  seedMembershipUsersIfEmpty();
  const users = loadMembershipUsers();
  const now = Date.now();
  const existingIndex = users.findIndex((user) => user.account === input.account);
  const tier = input.tier ?? users[existingIndex]?.tier ?? 'trial';

  if (existingIndex >= 0) {
    const updated: MembershipUser = {
      ...users[existingIndex],
      name: input.name,
      organization: input.organization,
      tier,
      lastActiveAt: now,
      status: tier === 'trial' ? 'trial' : 'active',
    };
    users[existingIndex] = updated;
    saveMembershipUsers(users);
    return updated;
  }

  const created: MembershipUser = {
    id: `user-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name,
    account: input.account,
    organization: input.organization,
    tier,
    status: tier === 'trial' ? 'trial' : 'active',
    createdAt: now,
    lastActiveAt: now,
  };
  saveMembershipUsers([created, ...users]);
  return created;
}

export function saveDemoUser(profile: Omit<DemoUserProfile, 'createdAt'> & { membershipTier?: MembershipTier }) {
  const registryUser = upsertMembershipUser({
    name: profile.name,
    account: profile.account,
    organization: profile.organization,
    tier: profile.membershipTier,
  });
  localStorage.setItem(
    DEMO_USER_KEY,
    JSON.stringify({
      name: profile.name,
      account: profile.account,
      organization: profile.organization,
      membershipTier: registryUser.tier,
      createdAt: Date.now(),
    }),
  );
}

export function setMembershipTierForAccount(account: string, tier: MembershipTier): void {
  const users = loadMembershipUsers().map((user) => (
    user.account === account
      ? { ...user, tier, status: tier === 'trial' ? 'trial' as const : 'active' as const }
      : user
  ));
  saveMembershipUsers(users);

  const profile = loadDemoUser();
  if (profile?.account === account) {
    localStorage.setItem(
      DEMO_USER_KEY,
      JSON.stringify({ ...profile, membershipTier: tier }),
    );
  }
}

export function touchMembershipUser(account: string, fallback?: { name?: string; organization?: string }): MembershipTier {
  if (!account.trim()) return 'trial';
  const user = upsertMembershipUser({
    name: fallback?.name?.trim() || account,
    account: account.trim(),
    organization: fallback?.organization,
  });
  const profile = loadDemoUser();
  if (profile && profile.account === account) {
    localStorage.setItem(
      DEMO_USER_KEY,
      JSON.stringify({ ...profile, membershipTier: user.tier }),
    );
  }
  return user.tier;
}

export function clearAuthed(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export type BoundReplayEvent = Pick<ReplayWorkspace, 'workspace_path' | 'workspace_name' | 'title' | 'created_time' | 'message_count'>;

export function saveBoundReplayEvent(event: BoundReplayEvent): void {
  localStorage.setItem(BOUND_REPLAY_EVENT_KEY, JSON.stringify(event));
}

export function loadBoundReplayEvent(): BoundReplayEvent | null {
  try {
    const raw = localStorage.getItem(BOUND_REPLAY_EVENT_KEY);
    return raw ? (JSON.parse(raw) as BoundReplayEvent) : null;
  } catch {
    return null;
  }
}

export function clearBoundReplayEvent(): void {
  localStorage.removeItem(BOUND_REPLAY_EVENT_KEY);
}

export function loadWorkspaceDraft(): string {
  return localStorage.getItem(DRAFT_KEY) ?? '';
}

export function saveWorkspaceDraft(value: string): void {
  if (!value.trim()) {
    localStorage.removeItem(DRAFT_KEY);
    return;
  }
  localStorage.setItem(DRAFT_KEY, value);
}

export function clearWorkspaceDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function getLastManusStepRaw(): string | null {
  return localStorage.getItem(LAST_STEP_KEY);
}

export function saveLastManusStep(data: unknown): void {
  localStorage.setItem(
    LAST_STEP_KEY,
    JSON.stringify({
      message: data,
      savedAt: Date.now(),
    }),
  );
}

export function getPendingRequestsRaw(): string | null {
  return localStorage.getItem(PENDING_KEY);
}

export function getPlanIdMapRaw(): string | null {
  return localStorage.getItem(PLAN_MAP_KEY);
}

export function readPendingRequests(): Record<string, PendingMessageRecord> {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PendingMessageRecord>) : {};
  } catch {
    return {};
  }
}

export function writePendingRequests(data: Record<string, PendingMessageRecord>): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(data));
}

export function markPendingRequest(topic: string, record: PendingMessageRecord): void {
  const current = readPendingRequests();
  current[topic] = record;
  writePendingRequests(current);
}

export function updatePendingFlag(topic: string, stillPending: boolean): void {
  const current = readPendingRequests();
  if (!current[topic]) {
    return;
  }
  current[topic].stillPending = stillPending;
  writePendingRequests(current);
}

export function clearPendingRequest(topic: string): void {
  const current = readPendingRequests();
  delete current[topic];
  writePendingRequests(current);
}

export function readPlanIdMap(): Record<string, PlanMapRecord> {
  try {
    const raw = localStorage.getItem(PLAN_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PlanMapRecord>) : {};
  } catch {
    return {};
  }
}

export function ensurePlanIdForTopic(topic: string): string {
  const current = readPlanIdMap();
  const existing = current[topic];
  if (existing?.planId && existing.completed !== true) {
    return existing.planId;
  }

  const planId = crypto.randomUUID();
  current[topic] = {
    planId,
    stillPending: true,
    completed: false,
  };
  localStorage.setItem(PLAN_MAP_KEY, JSON.stringify(current));
  return planId;
}

export function markPlanCompleted(topic: string): void {
  const current = readPlanIdMap();
  if (!current[topic]) {
    return;
  }
  current[topic].completed = true;
  current[topic].stillPending = false;
  localStorage.setItem(PLAN_MAP_KEY, JSON.stringify(current));
}

export function getOrCreateWsClientKey(): string {
  const current = localStorage.getItem(WS_CLIENT_KEY);
  if (current) {
    return current;
  }
  const created = crypto.randomUUID();
  localStorage.setItem(WS_CLIENT_KEY, created);
  return created;
}

export function loadAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as AdminConfig) : {};
  } catch {
    return {};
  }
}

export function saveAdminConfig(config: AdminConfig): void {
  const current = loadAdminConfig();
  localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify({ ...current, ...config }));
}

const PENDING_TASK_KEY = 'lexhub:pendingWorkspaceTask';
const WORKSPACE_SESSION_KEY = 'lexhub:workspaceSession';
const MATTERS_KEY = 'lexhub:matters';
const ACTIVE_MATTER_KEY = 'lexhub:activeMatterId';

import type { ChatMessage } from '../types/chat';
import type { DocumentIntake } from '../types/document-intake';

export type WorkspaceSessionRecord = {
  matterId?: string;
  matterTitle?: string;
  topic: string;
  query: string;
  scenario?: string;
  documentIntake?: DocumentIntake;
  messages: ChatMessage[];
  completedAt?: number;
  workspacePath?: string;
};

export function saveWorkspaceSession(session: WorkspaceSessionRecord): void {
  sessionStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(session));
}

export function loadWorkspaceSession(): WorkspaceSessionRecord | null {
  const raw = sessionStorage.getItem(WORKSPACE_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkspaceSessionRecord;
  } catch {
    return null;
  }
}

export function clearWorkspaceSession(): void {
  sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
}

export type PendingWorkspaceTask = {
  matterId?: string;
  content: string;
  uploadIds: string[];
  scenario?: string;
  taskId?: string;
  taskTitle?: string;
  documentIntake?: DocumentIntake;
};

export function storePendingWorkspaceTask(task: PendingWorkspaceTask): void {
  sessionStorage.setItem(PENDING_TASK_KEY, JSON.stringify(task));
}

export function consumePendingWorkspaceTask(): PendingWorkspaceTask | null {
  const raw = sessionStorage.getItem(PENDING_TASK_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_TASK_KEY);
  try {
    return JSON.parse(raw) as PendingWorkspaceTask;
  } catch {
    return null;
  }
}

export function peekPendingWorkspaceTask(): PendingWorkspaceTask | null {
  const raw = sessionStorage.getItem(PENDING_TASK_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingWorkspaceTask;
  } catch {
    return null;
  }
}

export type MatterStatus = 'draft' | 'running' | 'completed' | 'failed' | 'archived';

export type MatterRecord = {
  id: string;
  title: string;
  query: string;
  scenario?: string;
  documentIntake?: DocumentIntake;
  uploadIds: string[];
  workspacePath?: string;
  status: MatterStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

function loadMatters(): MatterRecord[] {
  try {
    const raw = localStorage.getItem(MATTERS_KEY);
    return raw ? (JSON.parse(raw) as MatterRecord[]) : [];
  } catch {
    return [];
  }
}

function saveMatters(matters: MatterRecord[]): void {
  localStorage.setItem(MATTERS_KEY, JSON.stringify(matters));
}

export function listMatters(): MatterRecord[] {
  return [...loadMatters()].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function createMatter(record: Omit<MatterRecord, 'createdAt' | 'updatedAt'>): MatterRecord {
  const now = Date.now();
  const matter = { ...record, createdAt: now, updatedAt: now };
  saveMatters([matter, ...loadMatters().filter((item) => item.id !== matter.id)]);
  localStorage.setItem(ACTIVE_MATTER_KEY, matter.id);
  return matter;
}

export function getMatter(matterId?: string | null): MatterRecord | null {
  const id = matterId ?? localStorage.getItem(ACTIVE_MATTER_KEY);
  if (!id) return null;
  return loadMatters().find((item) => item.id === id) ?? null;
}

export function setActiveMatter(matterId: string): void {
  localStorage.setItem(ACTIVE_MATTER_KEY, matterId);
}

export function updateMatter(matterId: string, patch: Partial<Omit<MatterRecord, 'id' | 'createdAt'>>): MatterRecord | null {
  let updated: MatterRecord | null = null;
  const matters = loadMatters().map((item) => {
    if (item.id !== matterId) return item;
    updated = { ...item, ...patch, updatedAt: Date.now() };
    return updated;
  });
  if (updated) saveMatters(matters);
  return updated;
}
