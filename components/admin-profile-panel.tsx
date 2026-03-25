"use client";

import { FormEvent, useState } from "react";
import { AdminRole } from "@/lib/permissions";
import { ImageUploadCrop } from "@/components/image-upload-crop";

type ProfileState = {
  id: string;
  email: string;
  role: AdminRole;
  name?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
};

export function AdminProfilePanel({ initialProfile }: { initialProfile: ProfileState }) {
  const [profile, setProfile] = useState({
    name: initialProfile.name ?? "",
    email: initialProfile.email,
    phone: initialProfile.phone ?? "",
    address: initialProfile.address ?? "",
    profileImageUrl: initialProfile.profileImageUrl ?? ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const trimmedProfileImageUrl = profile.profileImageUrl.trim();
      const payload: {
        name: string;
        email: string;
        phone: string;
        address: string;
        profileImageUrl?: string;
      } = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address
      };
      if (trimmedProfileImageUrl) {
        payload.profileImageUrl = trimmedProfileImageUrl;
      }
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "profile_update_failed");
      }

      setMessage("Profile updated.");
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "profile_update_failed";
      setError(`Profile update failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/profile/password", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(passwordForm)
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "password_update_failed");
      }

      setPasswordForm({ currentPassword: "", newPassword: "" });
      setMessage("Password updated.");
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "password_update_failed";
      setError(`Password update failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="card card-pad stack">
        <h2 className="section-title">My Profile</h2>
        <div className="list-item">
          <strong>Role:</strong> {initialProfile.role.replaceAll("_", " ")}
        </div>
        <form className="stack" onSubmit={onSaveProfile}>
          <div className="form-grid">
            <label className="field">
              <span>Name</span>
              <input
                value={profile.name}
                onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Your full name"
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                value={profile.phone}
                onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+1 000 000 0000"
              />
            </label>
          <label className="field">
            <span>Profile Image URL</span>
            <input
              value={profile.profileImageUrl}
              onChange={(event) => setProfile((prev) => ({ ...prev, profileImageUrl: event.target.value }))}
              placeholder="https://..."
            />
          </label>
        </div>
        <ImageUploadCrop
          value={profile.profileImageUrl}
          onChange={(nextValue) => setProfile((prev) => ({ ...prev, profileImageUrl: nextValue }))}
          label="Upload Profile Image"
        />
        <label className="field">
          <span>Address</span>
          <textarea
              value={profile.address}
              onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))}
            />
          </label>
          <div className="wrap">
            <button className="btn" type="submit" disabled={loading}>Save profile</button>
          </div>
        </form>
      </section>

      <section className="card card-pad stack">
        <h2 className="section-title">Change Password</h2>
        <form className="stack" onSubmit={onChangePassword}>
          <label className="field">
            <span>Current Password</span>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>New Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            />
          </label>
          <div className="wrap">
            <button className="btn" type="submit" disabled={loading}>Update password</button>
          </div>
        </form>
      </section>

      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </div>
  );
}
