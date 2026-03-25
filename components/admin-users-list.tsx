"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole, FeaturePermissions } from "@/lib/permissions";

type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: FeaturePermissions;
  isActive: boolean;
  isOnline: boolean;
  name?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
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

function getUserDisplayName(user: AdminUser) {
  const trimmed = user.name?.trim();
  if (trimmed) {
    return trimmed;
  }
  return "-";
}

function getUserInitial(user: AdminUser) {
  const source = user.name?.trim() || user.email.trim();
  if (!source) {
    return "?";
  }
  return source.charAt(0).toUpperCase();
}

function roleChipClass(role: AdminRole) {
  return `chip user-role-chip user-role-${role.replaceAll("_", "-")}`;
}

function statusChipClass(isActive: boolean) {
  return isActive ? "chip user-status-chip user-status-active" : "chip user-status-chip user-status-inactive";
}

function loginState(user: AdminUser) {
  if (user.isOnline) {
    return <span className="chip user-status-chip user-status-online">online</span>;
  }
  return formatDate(user.lastLoginAt);
}

export function AdminUsersList({
  currentAdminId,
  currentRole,
  canAddUsers,
  canDeleteUsers,
  initialUsers
}: {
  currentAdminId: string;
  currentRole: AdminRole;
  canAddUsers: boolean;
  canDeleteUsers: boolean;
  initialUsers: AdminUser[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "delete_failed");
      }
      await refreshUsers();
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
        <div className="row-between">
          <h2 className="section-title">All Users</h2>
          {canAddUsers && (
            <Link className="btn" href="/admin/users/new">
              Create User
            </Link>
          )}
        </div>
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
                  <td>
                    <div className="admin-user-name-cell">
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.name ?? user.email}
                          className="admin-user-row-avatar"
                        />
                      ) : (
                        <span className="admin-user-row-avatar admin-user-row-avatar-fallback">
                          {getUserInitial(user)}
                        </span>
                      )}
                      <span>{getUserDisplayName(user)}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={roleChipClass(user.role)}>{user.role.replaceAll("_", " ")}</span>
                  </td>
                  <td>
                    <span className={statusChipClass(user.isActive)}>{user.isActive ? "active" : "inactive"}</span>
                  </td>
                  <td>{loginState(user)}</td>
                  <td>
                    <div className="wrap" style={{ justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        disabled={!manageable || loading}
                      >
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
      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </div>
  );
}
