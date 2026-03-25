"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadCrop } from "@/components/image-upload-crop";
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
};

type FormState = {
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

function getCreatableRoles(actorRole: AdminRole): AdminRole[] {
  if (actorRole === "super_admin") {
    return ["super_admin", "admin", "moderator", "finance"];
  }
  if (actorRole === "admin") {
    return ["moderator", "finance"];
  }
  return [];
}

function PermissionMatrix({
  value,
  onChange
}: {
  value: FeaturePermissions;
  onChange: (next: FeaturePermissions) => void;
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

export function AdminUserEditor({
  mode,
  currentRole,
  currentAdminId,
  canDeleteUsers,
  initialUser
}: {
  mode: "create" | "edit";
  currentRole: AdminRole;
  currentAdminId: string;
  canDeleteUsers: boolean;
  initialUser?: AdminUser;
}) {
  const router = useRouter();
  const creatableRoles = useMemo(() => getCreatableRoles(currentRole), [currentRole]);
  const defaultRole = initialUser?.role ?? creatableRoles[0] ?? "moderator";
  const [form, setForm] = useState<FormState>({
    name: initialUser?.name ?? "",
    email: initialUser?.email ?? "",
    role: defaultRole,
    phone: initialUser?.phone ?? "",
    address: initialUser?.address ?? "",
    profileImageUrl: initialUser?.profileImageUrl ?? "",
    isActive: initialUser?.isActive ?? true,
    password: ""
  });
  const [permissions, setPermissions] = useState<FeaturePermissions>(
    initialUser?.permissions ?? defaultRolePermissions(defaultRole)
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const trimmedProfileImageUrl = form.profileImageUrl.trim();
      const basePayload = {
        name: form.name,
        email: form.email,
        role: form.role,
        phone: form.phone,
        address: form.address,
        isActive: form.isActive,
        permissions
      } as {
        name: string;
        email: string;
        role: AdminRole;
        phone: string;
        address: string;
        isActive: boolean;
        permissions: FeaturePermissions;
        profileImageUrl?: string;
        password?: string;
      };
      if (trimmedProfileImageUrl) {
        basePayload.profileImageUrl = trimmedProfileImageUrl;
      }

      if (mode === "create") {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...basePayload,
            password: form.password
          })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? "create_failed");
        }
        setMessage("User created.");
        router.push("/admin/users");
        return;
      }

      const response = await fetch(`/api/admin/users/${initialUser?.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...basePayload,
          password: form.password || undefined,
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "update_failed");
      }
      setMessage("User updated.");
      router.push("/admin/users");
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "request_failed";
      setError(`Save failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!initialUser || !canDeleteUsers || initialUser.id === currentAdminId) {
      return;
    }
    const confirmed = window.confirm(`Delete ${initialUser.email}?`);
    if (!confirmed) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${initialUser.id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "delete_failed");
      }
      router.push("/admin/users");
    } catch (deleteError) {
      const text = deleteError instanceof Error ? deleteError.message : "delete_failed";
      setError(`Delete failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card card-pad stack">
      <h2 className="section-title">{mode === "create" ? "Create User" : "Edit User"}</h2>
      <form className="stack" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" required value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          </label>
          <label className="field">
            <span>Role</span>
            <select
              value={form.role}
              onChange={(event) => {
                const nextRole = event.target.value as AdminRole;
                setForm((prev) => ({ ...prev, role: nextRole }));
                setPermissions(defaultRolePermissions(nextRole));
              }}
            >
              {(mode === "edit" ? getCreatableRoles(currentRole) : creatableRoles).map((role) => (
                <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          {mode === "edit" && (
            <label className="field">
              <span>Status</span>
              <select value={form.isActive ? "active" : "inactive"} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.value === "active" }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          )}
          <label className="field">
            <span>Phone</span>
            <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          </label>
          <label className="field">
            <span>Profile Image URL</span>
            <input value={form.profileImageUrl} onChange={(event) => setForm((prev) => ({ ...prev, profileImageUrl: event.target.value }))} />
          </label>
        </div>
        <ImageUploadCrop
          value={form.profileImageUrl}
          onChange={(nextValue) => setForm((prev) => ({ ...prev, profileImageUrl: nextValue }))}
          label="Upload Profile Image"
        />
        <label className="field">
          <span>Address</span>
          <textarea value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
        </label>
        <label className="field">
          <span>{mode === "create" ? "Password" : "New Password (optional)"}</span>
          <input
            type="password"
            minLength={8}
            required={mode === "create"}
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
        </label>
        <h3 className="section-title" style={{ fontSize: "1rem" }}>Permission Matrix</h3>
        <PermissionMatrix value={permissions} onChange={setPermissions} />
        <div className="wrap">
          <button type="submit" className="btn" disabled={loading}>
            {mode === "create" ? "Create user" : "Save changes"}
          </button>
          {mode === "edit" && initialUser && canDeleteUsers && initialUser.id !== currentAdminId && (
            <button type="button" className="btn-secondary" disabled={loading} onClick={onDelete}>
              Delete
            </button>
          )}
          <button type="button" className="btn-ghost" disabled={loading} onClick={() => router.push("/admin/users")}>
            Cancel
          </button>
        </div>
      </form>
      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </section>
  );
}
