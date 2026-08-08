import { useRef, useState } from "react";
import { theme } from "../../Theme";
import { adminUploadImages } from "../../services/api";
import { labelStyle } from "./adminFormKit";

/* ── single image — used for hero/cover images ─────────────────────────── */
export function SingleImageUpload({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const { urls } = await adminUploadImages([file]);
      onChange(urls[0]);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 88, height: 88, borderRadius: theme.radii.md, flexShrink: 0,
          background: theme.colors.bgSurface, border: `1px solid ${theme.colors.borderLight}`,
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          {value ? (
            <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : "🖼️"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              background: theme.colors.bgSurface, color: theme.colors.textBody,
              border: `1.5px solid ${theme.colors.borderLight}`, borderRadius: theme.radii.md,
              padding: "8px 16px", fontSize: 13, fontWeight: theme.typography.weightBold,
              fontFamily: theme.typography.fontBody, cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading..." : value ? "Replace Image" : "Upload Image"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              style={{
                background: "none", border: "none", color: theme.colors.danger,
                fontSize: 12, fontWeight: theme.typography.weightMedium, cursor: "pointer",
                textAlign: "left", padding: 0, fontFamily: theme.typography.fontBody,
              }}
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={handleFile} style={{ display: "none" }}
        />
      </div>
      {error && <div style={{ fontSize: 12, color: theme.colors.danger, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

/* ── multi-image gallery ────────────────────────────────────────────────── */
export function GalleryUpload({ label, values, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const { urls } = await adminUploadImages(files);
      onChange([...values, ...urls]);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        {values.map((url, i) => (
          <div key={i} style={{
            position: "relative", width: 88, height: 88, borderRadius: theme.radii.md,
            overflow: "hidden", border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              type="button"
              onClick={() => removeAt(i)}
              style={{
                position: "absolute", top: 4, right: 4, width: 20, height: 20,
                borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)",
                color: "white", fontSize: 12, lineHeight: 1, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: 88, height: 88, borderRadius: theme.radii.md,
            border: `1.5px dashed ${theme.colors.borderLight}`, background: theme.colors.bgSurface,
            color: theme.colors.textMuted, fontSize: 12, fontWeight: theme.typography.weightBold,
            cursor: uploading ? "not-allowed" : "pointer", fontFamily: theme.typography.fontBody,
          }}
        >
          {uploading ? "Uploading..." : "+ Add"}
        </button>
      </div>

      <input
        ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
        onChange={handleFiles} style={{ display: "none" }}
      />
      {error && <div style={{ fontSize: 12, color: theme.colors.danger }}>{error}</div>}
    </div>
  );
}
