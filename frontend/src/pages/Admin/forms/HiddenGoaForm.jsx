import { useState } from "react";
import { inputStyle, toList, saveBusiness } from "../adminFormKit";
import { Field, Row, SectionHeading, ModalShell } from "./formUI";
import { SingleImageUpload, GalleryUpload } from "../ImageUpload";

const AREAS = ["north-goa", "south-goa", "panaji", "central-goa"];
const CATEGORIES = ["beach", "activity", "market", "heritage", "spiritual", "restaurant", "cafe", "hotel", "stay"];

const blank = {
  name: "", location: "", area: "", googleMapUrl: "", category: "activity",
  tagline: "", description: "", story: "", localTip: "",
  highlights: "", bestTime: "",
  heroImage: "", gallery: [], tags: "",
  featured: false, editorPick: false,
};

const toFormState = (biz) => ({
  ...blank,
  ...biz,
  highlights: (biz.highlights || []).join(", "),
  tags:       (biz.tags       || []).filter(t => t !== "hidden").join(", "),
  gallery:    biz.gallery || [],
});

const HiddenGoaForm = ({ business, onClose, onSaved }) => {
  const isEdit = !!business?._id;
  const [form, setForm] = useState(business ? toFormState(business) : blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      setError("Name and location are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      highlights: toList(form.highlights),
      tags: [...toList(form.tags), "hidden"],
    };

    try {
      const saved = await saveBusiness(business, payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? `Edit ${business.name}` : "Add Hidden Goa Spot"}
      onClose={onClose}
      onSubmit={handleSubmit}
      error={error}
      saving={saving}
      saveLabel={isEdit ? "Save Changes" : "Add Spot"}
    >
      <SectionHeading>Basics</SectionHeading>
      <Row>
        <Field label="Name *">
          <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Kakolem Beach" />
        </Field>
        <Field label="Category *">
          <select style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Location *">
          <input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="Cabo de Rama, South Goa" />
        </Field>
        <Field label="Area">
          <select style={inputStyle} value={form.area} onChange={e => set("area", e.target.value)}>
            <option value="">Select area</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </Row>
      <Field label="Google Maps URL">
        <input style={inputStyle} value={form.googleMapUrl} onChange={e => set("googleMapUrl", e.target.value)} placeholder="https://maps.google.com/?q=..." />
      </Field>

      <SectionHeading>Story</SectionHeading>
      <Field label="Tagline">
        <input style={inputStyle} value={form.tagline} onChange={e => set("tagline", e.target.value)} placeholder="Goa's best-kept secret" />
      </Field>
      <Field label="Description">
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={e => set("description", e.target.value)} />
      </Field>
      <Field label="Story (why it's worth seeking out)">
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.story} onChange={e => set("story", e.target.value)} />
      </Field>
      <Field label="Local Tip (how to actually find it)">
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.localTip} onChange={e => set("localTip", e.target.value)} />
      </Field>
      <Row>
        <Field label="Highlights (comma separated)">
          <input style={inputStyle} value={form.highlights} onChange={e => set("highlights", e.target.value)} placeholder="No crowds, untouched" />
        </Field>
        <Field label="Best Time">
          <input style={inputStyle} value={form.bestTime} onChange={e => set("bestTime", e.target.value)} placeholder="Early morning, low tide" />
        </Field>
      </Row>

      <SectionHeading>Media</SectionHeading>
      <SingleImageUpload label="Hero Image" value={form.heroImage} onChange={url => set("heroImage", url)} />
      <GalleryUpload label="Gallery Images" values={form.gallery} onChange={arr => set("gallery", arr)} />

      <SectionHeading>Tags & Flags</SectionHeading>
      <Field label="Extra Tags (comma separated — 'hidden' is added automatically)">
        <input style={inputStyle} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="popular, editors-pick" />
      </Field>
      <div style={{ display: "flex", gap: 24, marginBottom: 4 }}>
        {[{ key: "featured", label: "Featured" }, { key: "editorPick", label: "Editor's Pick" }].map(({ key, label }) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
            {label}
          </label>
        ))}
      </div>
    </ModalShell>
  );
};

export default HiddenGoaForm;
