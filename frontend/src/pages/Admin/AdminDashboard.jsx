import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminGetBusinesses,
  adminGetStats,
  adminApproveBusiness,
  adminRejectBusiness,
} from "../../services/api";
import { theme } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";

const TABS = ["pending", "approved", "rejected"];

const TAB_LABELS = {
  pending:  "⏳ Pending",
  approved: "✅ Approved",
  rejected: "❌ Rejected",
};

const STATUS_COLORS = {
  pending:  { bg: theme.colors.warningBg,  color: theme.colors.warning,  label: "Pending Review" },
  approved: { bg: theme.colors.successBg,  color: theme.colors.success,  label: "Approved" },
  rejected: { bg: theme.colors.dangerBg,   color: theme.colors.danger,   label: "Rejected" },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id of business being actioned
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // check admin token
    const token = localStorage.getItem("trugoa_admin_token");
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [bizData, statsData] = await Promise.all([
        adminGetBusinesses(),
        adminGetStats(),
      ]);
      setBusinesses(bizData);
      setStats(statsData);
    } catch (err) {
      if (err.message.includes("401")) navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const updated = await adminApproveBusiness(id);
      setBusinesses(prev => prev.map(b => b._id === id ? updated : b));
      setStats(prev => ({
        ...prev,
        pending:  prev.pending - 1,
        approved: prev.approved + 1,
      }));
    } catch (err) {
      alert("Failed to approve. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      const updated = await adminRejectBusiness(id);
      setBusinesses(prev => prev.map(b => b._id === id ? updated : b));
      setStats(prev => ({
        ...prev,
        pending:  prev.pending - 1,
        rejected: prev.rejected + 1,
      }));
    } catch (err) {
      alert("Failed to reject. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("trugoa_admin_token");
    navigate("/admin");
  };

  const filtered = businesses.filter(b => b.status === activeTab);

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.colors.bgPage,
      fontFamily: theme.typography.fontBody,
    }}>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div style={{
        background: theme.colors.bgDark,
        padding: `20px ${theme.spacing.pagePadding}`,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: theme.radii.md,
            background: theme.colors.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>
            🛡️
          </div>
          <div>
            <div style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 18, fontWeight: theme.typography.weightBlack,
              color: "white",
            }}>
              TruGoa Admin
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              Business Listings Dashboard
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)",
            borderRadius: theme.radii.pill,
            padding: "8px 18px", fontSize: 13,
            fontFamily: theme.typography.fontBody,
            cursor: "pointer",
          }}
        >
          Log Out
        </button>
      </div>

      <div style={{ padding: isMobile ? "16px" : `28px ${theme.spacing.pagePadding}` }}>

        {/* ── STATS ROW ────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 16, marginBottom: 28,
        }}>
          {[
            { label: "Total",    value: stats.total,    icon: "📋", color: theme.colors.textPrimary },
            { label: "Pending",  value: stats.pending,  icon: "⏳", color: theme.colors.warning },
            { label: "Approved", value: stats.approved, icon: "✅", color: theme.colors.success },
            { label: "Rejected", value: stats.rejected, icon: "❌", color: theme.colors.danger },
          ].map(stat => (
            <div key={stat.label} style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.radii.lg,
              padding: "20px",
              boxShadow: theme.shadows.card,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{
                fontFamily: theme.typography.fontDisplay,
                fontSize: 28, fontWeight: theme.typography.weightBlack,
                color: stat.color, marginBottom: 4,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                {stat.label} Listings
              </div>
            </div>
          ))}
        </div>

        {/* ── TABS ─────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 8,
          marginBottom: 24,
          borderBottom: `1px solid ${theme.colors.borderLight}`,
          paddingBottom: 0,
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab;
            const count = businesses.filter(b => b.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none", border: "none",
                  borderBottom: isActive
                    ? `2px solid ${theme.colors.primary}`
                    : "2px solid transparent",
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: isActive
                    ? theme.typography.weightBold
                    : theme.typography.weightRegular,
                  color: isActive ? theme.colors.textPrimary : theme.colors.textMuted,
                  cursor: "pointer",
                  fontFamily: theme.typography.fontBody,
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: -1,
                }}
              >
                {TAB_LABELS[tab]}
                <span style={{
                  background: isActive ? theme.colors.primaryLight : theme.colors.bgSurface,
                  color: isActive ? theme.colors.primaryText : theme.colors.textMuted,
                  borderRadius: theme.radii.pill,
                  padding: "1px 8px", fontSize: 12,
                  fontWeight: theme.typography.weightBold,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── CONTENT ──────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
            <div style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 18, fontWeight: theme.typography.weightBold,
              color: theme.colors.secondary,
            }}>
              Loading listings...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {activeTab === "pending" ? "🎉" : activeTab === "approved" ? "📋" : "🗑️"}
            </div>
            <div style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 18, fontWeight: theme.typography.weightBold,
              color: theme.colors.textPrimary, marginBottom: 6,
            }}>
              No {activeTab} listings
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textMuted }}>
              {activeTab === "pending" ? "All caught up! No listings waiting for review." : `No ${activeTab} listings yet.`}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(biz => (
              <div key={biz._id} style={{
                background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.radii.lg,
                padding: 20,
                boxShadow: theme.shadows.card,
               display: "flex",
               flexDirection: isMobile ? "column" : "row",
               gap: isMobile ? 12 : 16,
               alignItems: "flex-start",
              }}>

                {/* photo or emoji */}
                <div style={{
                  width: 80, height: 80, flexShrink: 0,
                  borderRadius: theme.radii.md,
                  overflow: "hidden",
                  background: theme.colors.bgSurface,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32,
                }}>
                  {biz.images?.length > 0 ? (
                    <img
                      src={biz.images[0]}
                      alt={biz.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : "🏪"}
                </div>

                {/* info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: theme.typography.fontDisplay,
                      fontSize: 16, fontWeight: theme.typography.weightBold,
                      color: theme.colors.textPrimary,
                    }}>
                      {biz.name}
                    </span>
                    <span style={{
                      background: STATUS_COLORS[biz.status].bg,
                      color: STATUS_COLORS[biz.status].color,
                      borderRadius: theme.radii.pill,
                      padding: "2px 10px", fontSize: 11,
                      fontWeight: theme.typography.weightBold,
                    }}>
                      {STATUS_COLORS[biz.status].label}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                      📍 {biz.location}
                    </span>
                    {biz.category && (
                      <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                        🏷️ {biz.category}
                      </span>
                    )}
                    {biz.price_range && (
                      <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                        💰 {biz.price_range}
                      </span>
                    )}
                  </div>

                  {biz.description && (
                    <div style={{
                      fontSize: 13, color: theme.colors.textBody,
                      lineHeight: 1.5, marginBottom: 8,
                      maxWidth: 500,
                    }}>
                      {biz.description}
                    </div>
                  )}

                  {biz.contact && (
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      📞 {biz.contact}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 6 }}>
                    Submitted {new Date(biz.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                </div>

                {/* action buttons — only show on pending */}
                {biz.status === "pending" && (
                 <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto", flexShrink: 0 }}>
                    <button
                      onClick={() => handleApprove(biz._id)}
                      disabled={actionLoading === biz._id}
                      style={{
                        background: actionLoading === biz._id
                          ? theme.colors.borderLight
                          : theme.colors.successBg,
                        color: actionLoading === biz._id
                          ? theme.colors.textMuted
                          : theme.colors.success,
                        border: `1.5px solid ${theme.colors.success}40`,
                        borderRadius: theme.radii.md,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: theme.typography.weightBold,
                        fontFamily: theme.typography.fontBody,
                        cursor: actionLoading === biz._id ? "not-allowed" : "pointer",
                        transition: theme.transitions.fast,
                      }}
                      onMouseEnter={e => {
                        if (actionLoading !== biz._id) {
                          e.currentTarget.style.background = theme.colors.success;
                          e.currentTarget.style.color = "white";
                        }
                      }}
                      onMouseLeave={e => {
                        if (actionLoading !== biz._id) {
                          e.currentTarget.style.background = theme.colors.successBg;
                          e.currentTarget.style.color = theme.colors.success;
                        }
                      }}
                    >
                      {actionLoading === biz._id ? "..." : "✅ Approve"}
                    </button>

                    <button
                      onClick={() => handleReject(biz._id)}
                      disabled={actionLoading === biz._id}
                      style={{
                        background: theme.colors.dangerBg,
                        color: theme.colors.danger,
                        border: `1.5px solid ${theme.colors.danger}40`,
                        borderRadius: theme.radii.md,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: theme.typography.weightBold,
                        fontFamily: theme.typography.fontBody,
                        cursor: actionLoading === biz._id ? "not-allowed" : "pointer",
                        transition: theme.transitions.fast,
                      }}
                      onMouseEnter={e => {
                        if (actionLoading !== biz._id) {
                          e.currentTarget.style.background = theme.colors.danger;
                          e.currentTarget.style.color = "white";
                        }
                      }}
                      onMouseLeave={e => {
                        if (actionLoading !== biz._id) {
                          e.currentTarget.style.background = theme.colors.dangerBg;
                          e.currentTarget.style.color = theme.colors.danger;
                        }
                      }}
                    >
                      {actionLoading === biz._id ? "..." : "❌ Reject"}
                    </button>
                  </div>
                )}

                {/* re-review button for approved/rejected */}
                {biz.status !== "pending" && (
                  <button
                    onClick={() => handleApprove(biz._id)}
                    style={{
                      background: "none",
                      border: `1px solid ${theme.colors.borderLight}`,
                      borderRadius: theme.radii.md,
                      padding: "8px 16px",
                      fontSize: 12,
                      color: theme.colors.textMuted,
                      fontFamily: theme.typography.fontBody,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    ↩ Re-approve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;