import { useState } from "react";
import { theme } from "../../Theme";
import { adminCreateBusiness, adminUpdateBusiness } from "../../services/api";
import { inputStyle, labelStyle, toList } from "./adminFormKit";
import { SingleImageUpload, GalleryUpload } from "./ImageUpload";

const CATEGORIES = ["restaurant", "cafe", "hotel", "stay", "beach", "activity", "market", "heritage", "nightlife"];
const AREAS = ["north-goa", "south-goa", "panaji", "central-goa"];
const PRICE_LEVELS = ["budget", "mid", "premium"];

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const SectionHeading = ({ children }) => (
  <div style={{
    fontSize: 12, fontWeight: theme.typography.weightBold, color: theme.colors.primary,
    textTransform: "uppercase", letterSpacing: "0.06em", margin: "28px 0 14px",
    paddingBottom: 8, borderBottom: `1px solid ${theme.colors.borderLight}`,
  }}>
    {children}
  </div>
);

const blankForm = {
  name: "", location: "", category: "", subCategory: "",
  tagline: "", description: "", story: "", localTip: "",
  highlights: "", mustTry: "", bestTime: "", idealFor: "",
  area: "", latitude: "", longitude: "", googleMapUrl: "",
  priceRange: "", priceLevel: "", openingHours: "", phone: "", website: "",
  heroImage: "", gallery: [],
  scamAlert: "", safetyTip: "",
  tags: "", season: "", visitDuration: "",
  featured: false, editorPick: false, featuredStory: false,
};

// Business doc (arrays) → form state (strings for comma fields, real array for gallery)
const toFormState = (biz) => ({
  ...blankForm,
  ...biz,
  latitude:  biz.latitude  != null ? String(biz.latitude)  : "",
  longitude: biz.longitude != null ? String(biz.longitude) : "",
  highlights: (biz.highlights || []).join(", "),
  mustTry:    (biz.mustTry    || []).join(", "),
  idealFor:   (biz.idealFor   || []).join(", "),
  tags:       (biz.tags       || []).join(", "),
  season:     (biz.season     || []).join(", "),
  gallery:    biz.gallery || [],
});

const BusinessForm = ({ business, onClose, onSaved }) => {
  const isEdit = !!business?._id;
  const [form, setForm] = useState(business ? toFormState(business) : blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim() || !form.category) {
      setError("Name, location and category are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      latitude:  form.latitude  ? Number(form.latitude)  : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      highlights: toList(form.highlights),
      mustTry:    toList(form.mustTry),
      idealFor:   toList(form.idealFor),
      tags:       toList(form.tags),
      season:     toList(form.season),
    };

    try {
      const saved = isEdit
        ? await adminUpdateBusiness(business._id, payload)
        : await adminCreateBusiness(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 900 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 901, background: "white", borderRadius: theme.radii.xl,
        width: "92%", maxWidth: 760, maxHeight: "88vh", overflowY: "auto",
        boxShadow: theme.shadows.modal, border: `1px solid ${theme.colors.borderLight}`,
        fontFamily: theme.typography.fontBody,
      }}>
        <div style={{
          position: "sticky", top: 0, background: "white", zIndex: 1,
          padding: "20px 28px", borderBottom: `1px solid ${theme.colors.borderLight}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 20,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, margin: 0,
          }}>
            {isEdit ? `Edit ${business.name}` : "Add New Business"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: theme.colors.textMuted, cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px 28px 28px" }}>
          <SectionHeading>Basics</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Name *">
              <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} />
            </Field>
            <Field label="Category *">
              <select style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Location *">
              <input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="Baga Beach, North Goa" />
            </Field>
            <Field label="Sub-category">
              <input style={inputStyle} value={form.subCategory} onChange={e => set("subCategory", e.target.value)} placeholder="seafood, heritage hotel..." />
            </Field>
          </div>

          <SectionHeading>Content & Story</SectionHeading>
          <Field label="Tagline">
            <input style={inputStyle} value={form.tagline} onChange={e => set("tagline", e.target.value)} placeholder="Best prawn curry on Baga Beach" />
          </Field>

          <Field label="Description">
            <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={e => set("description", e.target.value)} />
          </Field>

          <Field label="Story (deeper narrative)">
            <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.story} onChange={e => set("story", e.target.value)} />
          </Field>

          <Field label="Local Tip">
            <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.localTip} onChange={e => set("localTip", e.target.value)} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Highlights (comma separated)">
              <input style={inputStyle} value={form.highlights} onChange={e => set("highlights", e.target.value)} placeholder="Fresh catch daily, No tourist markup" />
            </Field>
            <Field label="Must Try (comma separated)">
              <input style={inputStyle} value={form.mustTry} onChange={e => set("mustTry", e.target.value)} placeholder="Prawn balchão, Bebinca" />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Ideal For (comma separated)">
              <input style={inputStyle} value={form.idealFor} onChange={e => set("idealFor", e.target.value)} placeholder="couples, families, solo" />
            </Field>
            <Field label="Best Time">
              <input style={inputStyle} value={form.bestTime} onChange={e => set("bestTime", e.target.value)} placeholder="November–February, before 1pm" />
            </Field>
          </div>

          <SectionHeading>Location</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Area">
              <select style={inputStyle} value={form.area} onChange={e => set("area", e.target.value)}>
                <option value="">Select area</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Google Map URL">
              <input style={inputStyle} value={form.googleMapUrl} onChange={e => set("googleMapUrl", e.target.value)} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Latitude">
              <input style={inputStyle} type="number" step="any" value={form.latitude} onChange={e => set("latitude", e.target.value)} />
            </Field>
            <Field label="Longitude">
              <input style={inputStyle} type="number" step="any" value={form.longitude} onChange={e => set("longitude", e.target.value)} />
            </Field>
          </div>

          <SectionHeading>Pricing & Hours</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Price Range">
              <input style={inputStyle} value={form.priceRange} onChange={e => set("priceRange", e.target.value)} placeholder="₹400–₹800 per person" />
            </Field>
            <Field label="Price Level">
              <select style={inputStyle} value={form.priceLevel} onChange={e => set("priceLevel", e.target.value)}>
                <option value="">Select price level</option>
                {PRICE_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Opening Hours">
              <input style={inputStyle} value={form.openingHours} onChange={e => set("openingHours", e.target.value)} placeholder="8am – 11pm daily" />
            </Field>
            <Field label="Visit Duration">
              <input style={inputStyle} value={form.visitDuration} onChange={e => set("visitDuration", e.target.value)} placeholder="1–2 hours" />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Phone">
              <input style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} />
            </Field>
            <Field label="Website">
              <input style={inputStyle} value={form.website} onChange={e => set("website", e.target.value)} />
            </Field>
          </div>

          <SectionHeading>Media</SectionHeading>
          <SingleImageUpload label="Hero Image" value={form.heroImage} onChange={url => set("heroImage", url)} />
          <GalleryUpload label="Gallery Images" values={form.gallery} onChange={arr => set("gallery", arr)} />

          <SectionHeading>Safety</SectionHeading>
          <Field label="Scam Alert">
            <input style={inputStyle} value={form.scamAlert} onChange={e => set("scamAlert", e.target.value)} placeholder="Don't pay touts outside — use official counter" />
          </Field>

          <Field label="Safety Tip">
            <input style={inputStyle} value={form.safetyTip} onChange={e => set("safetyTip", e.target.value)} />
          </Field>

          <SectionHeading>Tags & Flags</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Tags (comma separated)">
              <input style={inputStyle} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="hidden, editors-pick, popular" />
            </Field>
            <Field label="Season (comma separated)">
              <input style={inputStyle} value={form.season} onChange={e => set("season", e.target.value)} placeholder="winter, monsoon" />
            </Field>
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
            {[
              { key: "featured",      label: "Featured" },
              { key: "editorPick",    label: "Editor's Pick" },
              { key: "featuredStory", label: "Featured Story" },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: theme.colors.textBody, cursor: "pointer" }}>
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>

          {error && (
            <div style={{
              background: theme.colors.dangerBg, border: `1px solid ${theme.colors.danger}40`,
              borderRadius: theme.radii.md, padding: "10px 14px", fontSize: 13,
              color: theme.colors.danger, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{
              background: "none", border: `1.5px solid ${theme.colors.borderLight}`,
              borderRadius: theme.radii.md, padding: "12px 22px", fontSize: 14,
              fontWeight: theme.typography.weightMedium, color: theme.colors.textBody,
              cursor: "pointer", fontFamily: theme.typography.fontBody,
            }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{
              background: saving ? theme.colors.borderLight : theme.colors.primary,
              border: "none", borderRadius: theme.radii.md, padding: "12px 26px", fontSize: 14,
              fontWeight: theme.typography.weightBold, color: "white",
              cursor: saving ? "not-allowed" : "pointer", fontFamily: theme.typography.fontBody,
            }}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Business"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default BusinessForm;
