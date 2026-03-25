"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ADMIN_FEATURES,
  AdminFeature,
  AdminRole,
  FeaturePermissions,
  PERMISSION_ACTIONS,
  PermissionAction,
  defaultRolePermissions
} from "@/lib/permissions";

type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: FeaturePermissions;
  isActive: boolean;
  name?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

type CreateFormState = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  phone: string;
  address: string;
  profileImageUrl: string;
};

type EditFormState = {
  name: string;
  email: string;
  role: AdminRole;
  phone: string;
  address: string;
  profileImageUrl: string;
  isActive: boolean;
  password: string;
};

const FEATURE_LABELS: Record<AdminFeature, string> = {
  dashboard: "Dashboard",
  competitions: "Competitions",
  participants: "Participants",
  live_control: "Live Control",
  payouts: "Payouts",
  logs: "Logs",
  users: "Users"
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  add: "Add",
  edit: "Edit",
  delete: "Delete"
};

function canManageTarget(actorRole: AdminRole, targetRole: AdminRole) {
  if (actorRole === "super_admin") {
    return true;
  }
  if (actorRole === "admin") {
    return targetRole === "moderator" || targetRole === "finance";
  }
  return false;
}

function getCreatableRoles(actorRole: AdminRole): AdminRole[] {
  if (actorRole === "super_admin") {
    return ["super_admin", "admin", "moderator", "finance"];
  }
  if (actorRole === "admin") {
    return ["moderator", "finance"];
  }
  return [];
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString();
}

function PermissionMatrix({
  value,
  onChange,
  disabled
}: {
  value: FeaturePermissions;
  onChange: (next: FeaturePermissions) => void;
  disabled?: boolean;
}) {
  function toggle(feature: AdminFeature, action: PermissionAction, checked: boolean) {
    onChange({
      ...value,
      [feature]: {
        ...value[feature],
        [action]: checked
      }
    });
  }

  return (
    <div className="card" style={{ padding: 12, overflowX: "auto" }}>
      <table className="table" style={{ minWidth: 560 }}>
        <thead>
          <tr>
            <th>Feature</th>
            {PERMISSION_ACTIONS.map((action) => (
              <th key={action}>{ACTION_LABELS[action]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ADMIN_FEATURES.map((feature) => (
            <tr key={feature}>
              <td>{FEATURE_LABELS[feature]}</td>
              {PERMISSION_ACTIONS.map((action) => (
                <td key={action}>
                  <input
                    type="checkbox"
                    checked={value[feature][action]}
                    disabled={disabled}
                    onChange={(event) => toggle(feature, action, event.target.checked)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminUsersPanel({
  currentAdminId,
  currentRole,
  canAddUsers,
  canEditUsers,
  canDeleteUsers,
  initialUsers
}: {
  currentAdminId: string;
  currentRole: AdminRole;
  canAddUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  initialUsers: AdminUser[];
}) {
  const creatableRoles = useMemo(() => getCreatableRoles(currentRole), [currentRole]);

  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateFormState>({
    name: "",
    email: "",
    password: "",
    role: creatableRoles[0] ?? "moderator",
    phone: "",
    address: "",
    profileImageUrl: ""
  });
  const [createPermissions, setCreatePermissions] = useState<FeaturePermissions>(
    defaultRolePermissions(creatableRoles[0] ?? "moderator")
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editPermissions, setEditPermissions] = useState<FeaturePermissions | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !normalized
        || user.email.toLowerCase().includes(normalized)
        || (user.name ?? "").toLowerCase().includes(normalized);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "active" && user.isActive)
        || (statusFilter === "inactive" && !user.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  async function refreshUsers() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error ?? "failed_to_load_users");
    }
    setUsers(body.users ?? []);
  }

  function resetCreateForm(nextRole?: AdminRole) {
    const role = nextRole ?? creatableRoles[0] ?? "moderator";
    setCreateForm({
      name: "",
      email: "",
      password: "",
      role,
      phone: "",
      address: "",
      profileImageUrl: ""
    });
    setCreatePermissions(defaultRolePermissions(role));
  }

  async function onCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          ...createForm,
          permissions: createPermissions
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "create_failed");
      }

      await refreshUsers();
      resetCreateForm();
      setMessage("User created.");
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "create_failed";
      setError(`Create failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  function openEditor(user: AdminUser) {
    if (!canEditUsers || !canManageTarget(currentRole, user.role)) {
      return;
    }
    setEditingId(user.id);
    setEditForm({
      name: user.name ?? "",
      email: user.email,
      role: user.role,
      phone: user.phone ?? "",
      address: user.address ?? "",
      profileImageUrl: user.profileImageUrl ?? "",
      isActive: user.isActive,
      password: ""
    });
    setEditPermissions(user.permissions);
    setError(null);
    setMessage(null);
  }

  async function onUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editForm || !editPermissions) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${editingId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          ...editForm,
          password: editForm.password || undefined,
          permissions: editPermissions
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "update_failed");
      }

      await refreshUsers();
      setMessage("User updated.");
      setEditingId(null);
      setEditForm(null);
      setEditPermissions(null);
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "update_failed";
      setError(`Update failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteUser(user: AdminUser) {
    if (!canDeleteUsers || !canManageTarget(currentRole, user.role)) {
      return;
    }
    if (user.id === currentAdminId) {
      setError("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(`Delete ${user.email}?`);
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE"
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "delete_failed");
      }
      await refreshUsers();
      if (editingId === user.id) {
        setEditingId(null);
        setEditForm(null);
        setEditPermissions(null);
      }
      setMessage("User deleted.");
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "delete_failed";
      setError(`Delete failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="card card-pad stack">
        <h2 className="section-title">Create User</h2>
        {(creatableRoles.length === 0 || !canAddUsers) && (
          <div className="list-item">Your role cannot create users.</div>
        )}
        {creatableRoles.length > 0 && canAddUsers && (
          <form className="stack" onSubmit={onCreateUser}>
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Operator Name"
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="operator@matrixclan.com"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Min 8 characters"
                />
              </label>
              <label className="field">
                <span>Role</span>
                <select
                  value={createForm.role}
                  onChange={(event) => {
                    const nextRole = event.target.value as AdminRole;
                    setCreateForm((prev) => ({ ...prev, role: nextRole }));
                    setCreatePermissions(defaultRolePermissions(nextRole));
                  }}
                >
                  {creatableRoles.map((role) => (
                    <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  value={createForm.phone}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+1 000 000 0000"
                />
              </label>
              <label className="field">
                <span>Profile Image URL</span>
                <input
                  value={createForm.profileImageUrl}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, profileImageUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </label>
            </div>
            <label className="field">
              <span>Address</span>
              <textarea
                value={createForm.address}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="Address"
              />
            </label>
            <h3 className="section-title" style={{ fontSize: "1rem" }}>Permission Matrix</h3>
            <PermissionMatrix value={createPermissions} onChange={setCreatePermissions} />
            <div className="wrap">
              <button type="submit" className="btn" disabled={loading}>Create user</button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => resetCreateForm(createForm.role)}
                disabled={loading}
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="card card-pad stack">
        <h2 className="section-title">All Users</h2>
        <div className="form-grid">
          <label className="field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or email"
            />
          </label>
          <label className="field">
            <span>Role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | AdminRole)}>
              <option value="all">All</option>
              <option value="super_admin">super admin</option>
              <option value="admin">admin</option>
              <option value="moderator">moderator</option>
              <option value="finance">finance</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}>
              <option value="all">All</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const manageable = canManageTarget(currentRole, user.role);
              return (
                <tr key={user.id}>
                  <td>{user.name ?? "-"}</td>
                  <td>{user.email}</td>
                  <td>{user.role.replaceAll("_", " ")}</td>
                  <td>{user.isActive ? "active" : "inactive"}</td>
                  <td>{formatDate(user.lastLoginAt)}</td>
                  <td>
                    <div className="wrap" style={{ justifyContent: "flex-end" }}>
                      <button type="button" className="btn-ghost" onClick={() => openEditor(user)} disabled={!manageable || !canEditUsers || loading}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onDeleteUser(user)}
                        disabled={!manageable || !canDeleteUsers || user.id === currentAdminId || loading}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <div className="list-item">No users match current filters.</div>}
      </section>

      {canEditUsers && editingId && editForm && editPermissions && (
        <section className="card card-pad stack">
          <h2 className="section-title">Edit User</h2>
          <form className="stack" onSubmit={onUpdateUser}>
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input
                  value={editForm.name}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                />
              </label>
              <label className="field">
                <span>Role</span>
                <select
                  value={editForm.role}
                  onChange={(event) => {
                    const nextRole = event.target.value as AdminRole;
                    setEditForm((prev) => (prev ? { ...prev, role: nextRole } : prev));
                    setEditPermissions(defaultRolePermissions(nextRole));
                  }}
                >
                  {getCreatableRoles(currentRole).map((role) => (
                    <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={editForm.isActive ? "active" : "inactive"}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, isActive: event.target.value === "active" } : prev))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  value={editForm.phone}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, phone: event.target.value } : prev))}
                />
              </label>
              <label className="field">
                <span>Profile Image URL</span>
                <input
                  value={editForm.profileImageUrl}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, profileImageUrl: event.target.value } : prev))}
                />
              </label>
            </div>
            <label className="field">
              <span>Address</span>
              <textarea
                value={editForm.address}
                onChange={(event) => setEditForm((prev) => (prev ? { ...prev, address: event.target.value } : prev))}
              />
            </label>
            <label className="field">
              <span>New Password (optional)</span>
              <input
                type="password"
                minLength={8}
                value={editForm.password}
                onChange={(event) => setEditForm((prev) => (prev ? { ...prev, password: event.target.value } : prev))}
                placeholder="Leave blank to keep existing"
              />
            </label>
            <h3 className="section-title" style={{ fontSize: "1rem" }}>Permission Matrix</h3>
            <PermissionMatrix value={editPermissions} onChange={setEditPermissions} />
            <div className="wrap">
              <button type="submit" className="btn" disabled={loading}>Save changes</button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setEditingId(null);
                  setEditForm(null);
                  setEditPermissions(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </div>
  );
}
