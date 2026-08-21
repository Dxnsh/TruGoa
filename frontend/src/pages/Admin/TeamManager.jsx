import { useState, useEffect } from "react";
import { theme } from "../../Theme";
import {
  adminGetUsers, adminCreateUser, adminUpdateUser,
  adminResetUserPassword, adminDeleteUser,
} from "../../services/api";
import { inputStyle, labelStyle } from "./adminFormKit";

const ROLE_NOTE = {
  owner:  "Full access, including this page",
  editor: "Content only — can't manage admins",
};

const btn = (bg, color, border) => ({
  background: bg, color,
  border: `1.5px solid ${border || "transparent"}`,
  borderRadius: theme.radii.md, padding: "9px 16px", fontSize: 13,
  fontWeight: theme.typography.weightBold, cursor: "pointer",
  fontFamily: theme.typography.fontBody,
});

const blankForm = { name: "", email: "", password: "", role: "editor" };

const TeamManager = ({ isMobile, me }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setUsers(await adminGetUsers());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.password.length < 10) {
      setError("Name, email and a password of at least 10 characters are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminCreateUser(form);
      setForm(blankForm);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // One helper for every row action: they all mutate a single admin, then
  // re-read the list so the last-owner guards on the server stay the only
  // source of truth about what's allowed.
  const act = async (id, fn, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handlePassword = (user) => {
    const password = window.prompt(`New password for ${user.name} (at least 10 characters):`);
    if (!password) return;
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    act(user._id, () => adminResetUserPassword(user._id, password));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 20,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
          }}>
            Team
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
            {users.length} account{users.length === 1 ? "" : "s"} ·{" "}
            {users.filter(u => u.active).length} active
          </div>
        </div>
        <button onClick={() => { setShowForm(v => !v); setError(null); }}
          style={btn(theme.colors.primary, "white")}>
          {showForm ? "Cancel" : "+ Add Admin"}
        </button>
      </div>

      <p style={{ fontSize: 13, color: theme.colors.textMuted, lineHeight: 1.6, margin: "0 0 20px", maxWidth: 620 }}>
        Everyone signs in with their own email and password. Deactivating revokes
        access on the next request without deleting the account, which keeps their
        name attached to what they published.
      </p>

      {error && (
        <div style={{
          background: theme.colors.dangerBg, border: `1px solid ${theme.colors.danger}40`,
          borderRadius: theme.radii.md, padding: "10px 14px", fontSize: 13,
          color: theme.colors.danger, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} style={{
          background: theme.colors.bgCard, border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: theme.radii.lg, padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Password *</label>
              <input style={inputStyle} type="text" value={form.password}
                onChange={e => set("password", e.target.value)} placeholder="at least 10 characters" />
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                Shown in plain text so you can copy it to them — they should change it after.
              </div>
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select style={inputStyle} value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="editor">Editor</option>
                <option value="owner">Owner</option>
              </select>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                {ROLE_NOTE[form.role]}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button type="submit" disabled={saving}
              style={btn(saving ? theme.colors.borderLight : theme.colors.primary, "white")}>
              {saving ? "Adding..." : "Add Admin"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: theme.colors.textMuted }}>
          Loading team...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {users.map(user => {
            const isMe = me?.id === user._id;
            const busy = busyId === user._id;
            return (
              <div key={user._id} style={{
                background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.radii.lg, padding: 18,
                display: "flex", flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 12 : 16, alignItems: isMobile ? "stretch" : "center",
                opacity: user.active ? 1 : 0.6,
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{
                      fontFamily: theme.typography.fontDisplay, fontSize: 16,
                      fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary,
                    }}>
                      {user.name}
                    </span>
                    <span style={{
                      borderRadius: theme.radii.pill, padding: "3px 10px", fontSize: 11,
                      fontWeight: theme.typography.weightBold, textTransform: "uppercase",
                      letterSpacing: 0.4,
                      background: user.role === "owner" ? theme.colors.primaryLight : theme.colors.bgSurface,
                      color: user.role === "owner" ? theme.colors.primaryText : theme.colors.textMuted,
                    }}>
                      {user.role}
                    </span>
                    {!user.active && (
                      <span style={{
                        borderRadius: theme.radii.pill, padding: "3px 10px", fontSize: 11,
                        fontWeight: theme.typography.weightBold, textTransform: "uppercase",
                        background: theme.colors.dangerBg, color: theme.colors.danger,
                      }}>
                        Revoked
                      </span>
                    )}
                    {isMe && (
                      <span style={{ fontSize: 12, color: theme.colors.textMuted }}>(you)</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{user.email}</div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                    {user.lastLoginAt
                      ? `Last signed in ${new Date(user.lastLoginAt).toLocaleDateString()}`
                      : "Never signed in"}
                  </div>
                </div>

                {/* Your own row has no controls: every one of them would be
                    rejected by the server anyway, since locking yourself out
                    is never intentional. */}
                {!isMe && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                    <button disabled={busy} onClick={() => handlePassword(user)}
                      style={btn(theme.colors.bgSurface, theme.colors.textBody, theme.colors.borderLight)}>
                      Set password
                    </button>
                    <button disabled={busy}
                      onClick={() => act(user._id, () => adminUpdateUser(user._id, {
                        role: user.role === "owner" ? "editor" : "owner",
                      }))}
                      style={btn(theme.colors.bgSurface, theme.colors.textBody, theme.colors.borderLight)}>
                      {user.role === "owner" ? "Make editor" : "Make owner"}
                    </button>
                    <button disabled={busy}
                      onClick={() => act(user._id,
                        () => adminUpdateUser(user._id, { active: !user.active }),
                        user.active ? `Revoke access for ${user.name}?` : null)}
                      style={user.active
                        ? btn(theme.colors.bgSurface, theme.colors.danger, `${theme.colors.danger}40`)
                        : btn(theme.colors.primary, "white")}>
                      {busy ? "..." : user.active ? "Revoke" : "Restore"}
                    </button>
                    <button disabled={busy}
                      onClick={() => act(user._id, () => adminDeleteUser(user._id),
                        `Delete ${user.name}'s account permanently? Revoking is usually better.`)}
                      style={btn(theme.colors.dangerBg, theme.colors.danger, `${theme.colors.danger}40`)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamManager;
