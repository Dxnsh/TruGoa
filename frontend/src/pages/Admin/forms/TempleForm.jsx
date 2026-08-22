import { useState } from "react";
import { inputStyle, toList, saveBusiness } from "../adminFormKit";
import { Field, Row, SectionHeading, ModalShell } from "./formUI";
import { SingleImageUpload, GalleryUpload } from "../ImageUpload";

const AREAS = ["north-goa", "south-goa", "panaji", "central-goa"];

// Every listing here saves as category "spiritual"; the kind of holy place it
// is lives in subCategory, so a church isn't filed away as a temple.
const KINDS = ["temple", "church", "chapel", "cathedral", "mosque", "shrine", "monastery"];

const blank = {
  name: "", location: "", area: "", googleMapUrl: "", subCategory: "temple",
  tagline: "", description: "", story: "", localTip: "",
  highlights: "", bestTime: "", openingHours: "", visitDuration: "",
  dressCode: "",
  scamAlert: "", safetyTip: "",
  heroImage: "", gallery: [], tags: "",
  featured: false, editorPick: false,
};

const toFormState = (biz) => ({
  ...blank,
  ...biz,
  highlights: (biz.highlights || []).join(", "),
  tags:       (biz.tags       || []).join(", "),
  gallery:    biz.gallery || [],
});

const TempleForm = ({ business, onClose, onSaved }) => {
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

    // What to wear is the question visitors actually get wrong at a temple or
    // church, and there's no schema field for it — so it rides along as a
    // highlight rather than being dropped on save.
    const dress = form.dressCode.trim();
    const { dressCode: _dressCode, ...rest } = form;

    const payload = {
      ...rest,
      category: "spiritual",
      highlights: [...toList(form.highlights), ...(dress ? [`Dress code: ${dress}`] : [])],
      tags:       toList(form.tags),
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
      title={isEdit ? `Edit ${business.name}` : "Add Temple or Holy Place"}
      onClose={onClose}
      onSubmit={handleSubmit}
      error={error}
      saving={saving}
      saveLabel={isEdit ? "Save Changes" : "Add Place"}
    >
      <SectionHeading>Basics</SectionHeading>
      <Row>
        <Field label="Name *">
          <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Shri Mangueshi Temple" />
        </Field>
        <Field label="Kind of place">
          <select style={inputStyle} value={form.subCategory} onChange={e => set("subCategory", e.target.value)}>
            {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Location *">
          <input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="Mangeshi, Ponda" />
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
        <input style={inputStyle} value={form.tagline} onChange={e => set("tagline", e.target.value)} placeholder="Goa's grandest temple, 450 years old" />
      </Field>
      <Field label="Description">
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={e => set("description", e.target.value)} />
      </Field>
      <Field label="History / Significance">
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.story} onChange={e => set("story", e.target.value)} placeholder="Who it's dedicated to, when it was built, why it matters" />
      </Field>
      <Field label="Local Tip">
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.localTip} onChange={e => set("localTip", e.target.value)} placeholder="Come for the evening aarti — far quieter than the tour-bus hours" />
      </Field>
      <Field label="Highlights (comma separated)">
        <input style={inputStyle} value={form.highlights} onChange={e => set("highlights", e.target.value)} placeholder="Seven-storey lamp tower, evening aarti" />
      </Field>

      <SectionHeading>Visiting</SectionHeading>
      <Row>
        <Field label="Opening Hours">
          <input style={inputStyle} value={form.openingHours} onChange={e => set("openingHours", e.target.value)} placeholder="6am – 10pm daily" />
        </Field>
        <Field label="Best Time">
          <input style={inputStyle} value={form.bestTime} onChange={e => set("bestTime", e.target.value)} placeholder="Early morning, or the evening aarti" />
        </Field>
      </Row>
      <Row>
        <Field label="Visit Duration">
          <input style={inputStyle} value={form.visitDuration} onChange={e => set("visitDuration", e.target.value)} placeholder="30–45 minutes" />
        </Field>
        <Field label="Dress Code">
          <input style={inputStyle} value={form.dressCode} onChange={e => set("dressCode", e.target.value)} placeholder="Shoulders and knees covered; shoes off at the steps" />
        </Field>
      </Row>

      <SectionHeading>Media</SectionHeading>
      <SingleImageUpload label="Hero Image" value={form.heroImage} onChange={url => set("heroImage", url)} />
      <GalleryUpload label="Gallery Images" values={form.gallery} onChange={arr => set("gallery", arr)} />

      <SectionHeading>Safety</SectionHeading>
      <Field label="Scam Alert">
        <input style={inputStyle} value={form.scamAlert} onChange={e => set("scamAlert", e.target.value)} placeholder="Ignore 'compulsory donation' receipts at the gate" />
      </Field>
      <Field label="Safety Tip">
        <input style={inputStyle} value={form.safetyTip} onChange={e => set("safetyTip", e.target.value)} placeholder="Photography is not allowed inside the sanctum" />
      </Field>

      <SectionHeading>Tags & Flags</SectionHeading>
      <Field label="Tags (comma separated)">
        <input style={inputStyle} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="hidden, popular, editors-pick" />
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

export default TempleForm;
