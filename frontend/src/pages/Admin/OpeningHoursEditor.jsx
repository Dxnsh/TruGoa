import { useState } from "react";
import { theme } from "../../Theme";
import { labelStyle } from "./adminFormKit";
import { blankOpeningHours, BLANK_PERIOD, BLANK_DAY, HOURS_DAYS, HOURS_DAY_KEYS } from "./hoursShape";
import { parseHoursText } from "./parseHoursText";

// Day-by-day opening hours editor for the business forms.
//
// Value shape (matches Business.openingHours):
//   { monday: { closed, periods: [{ open, close }] }, …, is24Hours }
// A day can hold several periods — split hours like "10:00–14:00 & 15:30–19:30"
// for a lunch-and-dinner kitchen. `is24Hours` disables the per-day rows.
//
// The grid + the "Copy to…" / "Apply to all" shortcuts are the fastest way to
// enter the common repetitive case (same Mon–Sat, closed Sunday; identical all
// week). Those shortcuts only copy period/closed data between days in the React
// state — no text parsing, so there is no ambiguity risk.
//
// The "Paste hours" box below the grid is a secondary shortcut: it takes hours
// in whatever format they arrive (a 7-line block off Google, "10 AM–2 PM &
// 3:30–7:30 PM, Mon–Sat (Closed Sunday)", …), fills the grid, and leaves it for
// the admin to check. Fill one day with it, then Copy-to-all — no need to
// re-paste per day.

const timeInput = {
  padding: "7px 8px",
  border: `1.5px solid ${theme.colors.borderLight}`,
  borderRadius: theme.radii.md,
  fontSize: 13,
  fontFamily: theme.typography.fontBody,
  color: theme.colors.textPrimary,
  background: "white",
};

const linkBtn = {
  background: "none", border: "none", padding: 0, cursor: "pointer",
  fontFamily: theme.typography.fontBody, fontSize: 12,
  color: theme.colors.primary, fontWeight: theme.typography.weightMedium,
};

const mutedLink = { ...linkBtn, color: theme.colors.textMuted };

const LABEL_BY_KEY = Object.fromEntries(HOURS_DAYS);
const WEEKDAY_KEYS = HOURS_DAY_KEYS.slice(0, 5); // monday … friday

// A day counts as "configured" once it's marked Closed or has any time typed.
const isConfigured = (d) =>
  !!d && (d.closed === true || (d.periods || []).some((p) => p && (p.open || p.close)));

// Normalised copy of a day's grid state — Closed flag + its period rows.
const dayPayload = (src) => {
  const s = src || BLANK_DAY;
  if (s.closed) return { closed: true, periods: [{ ...BLANK_PERIOD }] };
  const periods = (s.periods?.length ? s.periods : [{ ...BLANK_PERIOD }]).map((p) => ({
    open: p.open || "",
    close: p.close || "",
  }));
  return { closed: false, periods };
};

const sameData = (a, b) =>
  JSON.stringify(dayPayload(a)) === JSON.stringify(dayPayload(b));

// Small inline panel: "Copy Monday's hours to: [x]Tue …" with a confirm step.
const CopyToPanel = ({ sourceKey, onCopy, onClose }) => {
  const targets = HOURS_DAYS.filter(([k]) => k !== sourceKey);
  const [picked, setPicked] = useState(
    () => new Set(targets.filter(([k]) => k !== "sunday").map(([k]) => k))
  );
  const toggle = (k) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        margin: "2px 0 6px",
        padding: "10px 12px",
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: theme.radii.md,
        background: theme.colors.surfaceMuted || "#fafafa",
      }}
    >
      <div style={{ fontSize: 12, color: theme.colors.textBody, marginBottom: 8 }}>
        Copy {LABEL_BY_KEY[sourceKey]}’s hours to:
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: 10 }}>
        {targets.map(([k, label]) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.colors.textBody, cursor: "pointer" }}>
            <input type="checkbox" checked={picked.has(k)} onChange={() => toggle(k)} />
            {label.slice(0, 3)}
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <button
          type="button"
          style={{ ...linkBtn, opacity: picked.size ? 1 : 0.5, cursor: picked.size ? "pointer" : "not-allowed" }}
          disabled={!picked.size}
          onClick={() => { onCopy(sourceKey, [...picked]); onClose(); }}
        >
          Copy
        </button>
        <button type="button" style={mutedLink} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

const OpeningHoursEditor = ({ value, onChange }) => {
  const v = value || blankOpeningHours();
  const [paste, setPaste] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [copyMenu, setCopyMenu] = useState(null); // day key whose "Copy to…" panel is open

  const setDay = (key, patch) => onChange({ ...v, [key]: { ...(v[key] || {}), ...patch } });

  const setPeriod = (key, i, patch) => {
    const periods = (v[key]?.periods || [{ ...BLANK_PERIOD }]).map((p, idx) =>
      idx === i ? { ...p, ...patch } : p
    );
    setDay(key, { periods });
  };
  const addPeriod = (key) =>
    setDay(key, { periods: [...(v[key]?.periods || []), { ...BLANK_PERIOD }] });
  const removePeriod = (key, i) => {
    const periods = (v[key]?.periods || []).filter((_, idx) => idx !== i);
    setDay(key, { periods: periods.length ? periods : [{ ...BLANK_PERIOD }] });
  };

  const runPaste = () => {
    const { hours, warnings: w } = parseHoursText(paste);
    onChange(hours);
    setWarnings(w);
    if (!w.length) setPasteOpen(false);
  };

  // --- Copy shortcuts: pure grid state → grid state, no parser, no API ---

  // Per-day copy: confirm before clobbering any target that already holds
  // different data.
  const copyDayTo = (sourceKey, targetKeys) => {
    const src = v[sourceKey] || BLANK_DAY;
    const payload = dayPayload(src);
    const next = { ...v };
    let wrote = false;
    for (const k of targetKeys) {
      if (k === sourceKey) continue;
      const cur = v[k] || BLANK_DAY;
      if (isConfigured(cur) && !sameData(cur, src)) {
        if (!window.confirm(`Overwrite ${LABEL_BY_KEY[k]}’s hours?`)) continue;
      }
      next[k] = { closed: payload.closed, periods: payload.periods.map((p) => ({ ...p })) };
      wrote = true;
    }
    if (wrote) onChange(next);
  };

  // Bulk apply (all 7 / weekdays): a single confirm listing the days that
  // already hold different data.
  const bulkApply = (targetKeys) => {
    const sourceKey = HOURS_DAY_KEYS.find((k) => isConfigured(v[k]));
    if (!sourceKey) return;
    const src = v[sourceKey];
    const conflicts = targetKeys.filter(
      (k) => k !== sourceKey && isConfigured(v[k]) && !sameData(v[k], src)
    );
    if (
      conflicts.length &&
      !window.confirm(
        `This overwrites different hours already entered for ` +
          `${conflicts.map((k) => LABEL_BY_KEY[k]).join(", ")}. Continue?`
      )
    )
      return;
    const payload = dayPayload(src);
    const next = { ...v };
    for (const k of targetKeys) {
      if (k === sourceKey) continue;
      next[k] = { closed: payload.closed, periods: payload.periods.map((p) => ({ ...p })) };
    }
    onChange(next);
  };

  const anyConfigured = HOURS_DAY_KEYS.some((k) => isConfigured(v[k]));

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>Opening Hours</label>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: theme.colors.textBody, cursor: "pointer", margin: "4px 0 12px" }}>
        <input
          type="checkbox"
          checked={v.is24Hours}
          onChange={(e) => onChange({ ...v, is24Hours: e.target.checked })}
        />
        Open 24 hours (every day)
      </label>

      {!v.is24Hours && anyConfigured && (
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, color: theme.colors.textMuted }}>
            First filled day →
          </span>
          <button type="button" style={linkBtn} onClick={() => bulkApply(HOURS_DAY_KEYS)}>
            Apply to all 7 days
          </button>
          <button type="button" style={linkBtn} onClick={() => bulkApply(WEEKDAY_KEYS)}>
            Apply to weekdays (Mon–Fri)
          </button>
        </div>
      )}

      <div style={{ display: "grid", gap: 10, opacity: v.is24Hours ? 0.45 : 1, pointerEvents: v.is24Hours ? "none" : "auto" }}>
        {HOURS_DAYS.map(([key, label]) => {
          const day = v[key] || { closed: false, periods: [{ ...BLANK_PERIOD }] };
          const periods = day.periods?.length ? day.periods : [{ ...BLANK_PERIOD }];
          return (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "88px 1fr", alignItems: "start", gap: 10, rowGap: 0 }}>
              <span style={{ fontSize: 13, color: theme.colors.textBody, paddingTop: 8 }}>{label}</span>
              <div style={{ display: "grid", gap: 6 }}>
                {day.closed ? (
                  <span style={{ fontSize: 13, color: theme.colors.textMuted, paddingTop: 8 }}>Closed</span>
                ) : (
                  periods.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <input
                        type="time"
                        style={timeInput}
                        value={p.open || ""}
                        onChange={(e) => setPeriod(key, i, { open: e.target.value })}
                      />
                      <span style={{ color: theme.colors.textMuted }}>–</span>
                      <input
                        type="time"
                        style={timeInput}
                        value={p.close || ""}
                        onChange={(e) => setPeriod(key, i, { close: e.target.value })}
                      />
                      {periods.length > 1 && (
                        <button type="button" style={{ ...linkBtn, color: theme.colors.textMuted }} onClick={() => removePeriod(key, i)}>
                          remove
                        </button>
                      )}
                    </div>
                  ))
                )}
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  {!day.closed && (
                    <button type="button" style={linkBtn} onClick={() => addPeriod(key)}>
                      + add hours
                    </button>
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.colors.textMuted, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={day.closed}
                      onChange={(e) => setDay(key, { closed: e.target.checked })}
                    />
                    Closed
                  </label>
                  {isConfigured(day) && (
                    <button
                      type="button"
                      style={mutedLink}
                      onClick={() => setCopyMenu((k) => (k === key ? null : key))}
                    >
                      {copyMenu === key ? "Close" : "Copy to…"}
                    </button>
                  )}
                </div>
              </div>
              {copyMenu === key && (
                <CopyToPanel
                  sourceKey={key}
                  onCopy={copyDayTo}
                  onClose={() => setCopyMenu(null)}
                />
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11.5, color: theme.colors.textMuted, marginTop: 8 }}>
        Split hours are fine — add a second row for a lunch break. Hours that cross
        midnight are fine too (e.g. 18:00 – 02:00). Leave a day blank if unknown.
      </p>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${theme.colors.borderLight}` }}>
        <button type="button" style={mutedLink} onClick={() => setPasteOpen((o) => !o)}>
          {pasteOpen ? "Hide paste box" : "Paste hours from Google or a website"}
        </button>
        {pasteOpen && (
          <div style={{ margin: "8px 0 2px" }}>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={5}
              placeholder={"e.g.\nMonday  9 AM–6 PM\nTuesday  10 AM–2 PM, 3:30–7:30 PM\n…\nor: 10 AM–2 PM & 3:30–7:30 PM, Mon–Sat (Closed Sunday)"}
              style={{ ...timeInput, width: "100%", minHeight: 96, resize: "vertical", lineHeight: 1.5 }}
            />
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
              <button
                type="button"
                onClick={runPaste}
                disabled={!paste.trim()}
                style={{
                  background: theme.colors.primary, border: "none", color: "white",
                  borderRadius: theme.radii.md, padding: "8px 16px", fontSize: 13,
                  fontWeight: theme.typography.weightBold, cursor: paste.trim() ? "pointer" : "not-allowed",
                  fontFamily: theme.typography.fontBody, opacity: paste.trim() ? 1 : 0.5,
                }}
              >
                Parse &amp; fill
              </button>
              <span style={{ fontSize: 11.5, color: theme.colors.textMuted }}>
                Fills the grid above — check it, then use “Apply to all” for the rest.
              </span>
            </div>
            {warnings.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: theme.colors.alert }}>
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpeningHoursEditor;
