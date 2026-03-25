export type AdminRole = "super_admin" | "admin" | "moderator" | "finance";

export type PermissionAction = "view" | "add" | "edit" | "delete";

export type AdminFeature =
  | "dashboard"
  | "competitions"
  | "participants"
  | "live_control"
  | "payouts"
  | "logs"
  | "users";

export type FeaturePermissions = Record<AdminFeature, Record<PermissionAction, boolean>>;

export const ADMIN_FEATURES: AdminFeature[] = [
  "dashboard",
  "competitions",
  "participants",
  "live_control",
  "payouts",
  "logs",
  "users"
];

export const PERMISSION_ACTIONS: PermissionAction[] = ["view", "add", "edit", "delete"];

function all(value: boolean): Record<PermissionAction, boolean> {
  return {
    view: value,
    add: value,
    edit: value,
    delete: value
  };
}

const ROLE_PERMISSION_TEMPLATES: Record<AdminRole, FeaturePermissions> = {
  super_admin: {
    dashboard: all(true),
    competitions: all(true),
    participants: all(true),
    live_control: all(true),
    payouts: all(true),
    logs: all(true),
    users: all(true)
  },
  admin: {
    dashboard: { view: true, add: false, edit: false, delete: false },
    competitions: { view: true, add: true, edit: true, delete: true },
    participants: { view: true, add: true, edit: true, delete: true },
    live_control: { view: true, add: true, edit: true, delete: false },
    payouts: { view: true, add: true, edit: true, delete: false },
    logs: { view: true, add: false, edit: false, delete: false },
    users: { view: true, add: true, edit: true, delete: false }
  },
  moderator: {
    dashboard: { view: true, add: false, edit: false, delete: false },
    competitions: { view: true, add: false, edit: false, delete: false },
    participants: { view: true, add: true, edit: true, delete: false },
    live_control: { view: true, add: true, edit: true, delete: false },
    payouts: { view: true, add: false, edit: false, delete: false },
    logs: { view: true, add: false, edit: false, delete: false },
    users: { view: false, add: false, edit: false, delete: false }
  },
  finance: {
    dashboard: { view: true, add: false, edit: false, delete: false },
    competitions: { view: true, add: false, edit: false, delete: false },
    participants: { view: true, add: false, edit: false, delete: false },
    live_control: { view: true, add: false, edit: false, delete: false },
    payouts: { view: true, add: true, edit: true, delete: false },
    logs: { view: true, add: false, edit: false, delete: false },
    users: { view: false, add: false, edit: false, delete: false }
  }
};

export function defaultRolePermissions(role: AdminRole): FeaturePermissions {
  return structuredClone(ROLE_PERMISSION_TEMPLATES[role]);
}

export function normalizePermissions(input: unknown, role: AdminRole): FeaturePermissions {
  const base = defaultRolePermissions(role);
  if (!input || typeof input !== "object") {
    return base;
  }

  const source = input as Partial<FeaturePermissions>;
  for (const feature of ADMIN_FEATURES) {
    for (const action of PERMISSION_ACTIONS) {
      const maybe = source[feature]?.[action];
      if (typeof maybe === "boolean") {
        base[feature][action] = maybe;
      }
    }
  }
  return base;
}

export function hasPermission(
  permissions: FeaturePermissions,
  feature: AdminFeature,
  action: PermissionAction
) {
  return !!permissions[feature]?.[action];
}
