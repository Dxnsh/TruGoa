import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadBusinessImages, createBusiness } from "../../services/api"; // ✅ single import
import { theme } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";
import {
  UtensilsCrossed,
  Coffee,
  Hotel,
  Home,
  Compass,
  Umbrella,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  Rocket,
  Store
} from "lucide-react";

const CATEGORIES = [
  { value: "restaurant", label: "Restaurant",   icon: <UtensilsCrossed size={18} />  },
  { value: "cafe",       label: "Café",          icon: <Coffee size={18} /> },
  { value: "hotel",      label: "Hotel",         icon: <Hotel size={18} /> },
  { value: "stay",       label: "Stay / Resort", icon: <Home size={18} /> },
  { value: "activity",   label: "Activity",      icon: <Compass size={18} /> },
  { value: "beach",      label: "Beach Shack",   icon: <Umbrella size={18} /> },
  { value: "market",     label: "Market / Shop", icon: <ShoppingBag size={18} /> },
  { value: "general",    label: "Other",         icon: <MapPin size={18} />},
];

const PRICE_RANGES = [
  { value: "budget",  label: "Budget Friendly", sub: "Under ₹500 per person",      },
  { value: "mid",     label: "Mid Range",        sub: "₹500 – ₹1500 per person",  },
  { value: "premium", label: "Premium",          sub: "₹1500 – ₹4000 per person", },
  { value: "luxury",  label: "Luxury",           sub: "₹4000+ per person",  },
];

const STEPS = ["Business Info", "Category & Pricing", "Review & Submit"];

const AddBusiness = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const isMobile = useIsMobile();

  // ✅ all useState hooks inside the component
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form, setForm] = useState({
    name:        "",
    location:    "",
    category:    "",
    price_range: "",
    trust_level: "risky",
    description: "",
    contact:     "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const setPick = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // ✅ inside the component
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setErrors(prev => ({ ...prev, images: "Maximum 5 photos allowed" }));
      return;
    }
    setImages(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...previews]);
    setErrors(prev => ({ ...prev, images: null }));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.name.trim())     e.name     = "Business name is required";
      if (!form.location.trim()) e.location = "Location is required";
    }
    if (step === 1) {
      if (!form.category)    e.category    = "Please select a category";
      if (!form.price_range) e.price_range = "Please select a price range";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

 const handleSubmit = async () => {
  if (submitting) return;
  setSubmitting(true);
  
  try {
    let imageUrls = [];
    

    if (images.length > 0) {
      setUploadingImages(true);
     
      const { urls } = await uploadBusinessImages(images);
     
      imageUrls = urls;
      setUploadingImages(false);
    }

    
    await createBusiness({ ...form, images: imageUrls });
   
    setSubmitted(true);
  } catch (err) {
    setErrors({ submit: "Something went wrong. Please try again." });
  } finally {
    setSubmitting(false);
    setUploadingImages(false);
  }
};

  // ── success screen ───────────────────────────────────────
  if (submitted) return (
    <div style={{
      minHeight: "80vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: `${theme.spacing.lg} ${theme.spacing.pagePadding}`,
      background: theme.colors.bgPage,
      fontFamily: theme.typography.fontBody,
    }}>
      <div style={{
        background: theme.colors.bgCard,
        borderRadius: theme.radii.xl,
        padding: "clamp(32px,6vw,56px)",
        maxWidth: 480, width: "100%",
        boxShadow: theme.shadows.modal,
        textAlign: "center",
        border: `1px solid ${theme.colors.borderLight}`,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: theme.colors.secondaryLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, margin: "0 auto 24px",
        }}>
          ✅
        </div>
        <h2 style={{
          fontFamily: theme.typography.fontDisplay,
          fontSize: 26, fontWeight: theme.typography.weightBlack,
          color: theme.colors.textPrimary, marginBottom: 12,
        }}>
          Listing Submitted!
        </h2>
        <p style={{ fontSize: 15, color: theme.colors.textBody, lineHeight: 1.7, marginBottom: 8 }}>
          <strong style={{ color: theme.colors.secondary }}>{form.name}</strong> has been submitted for review.
        </p>
        <p style={{ fontSize: 14, color: theme.colors.textMuted, lineHeight: 1.7, marginBottom: 32 }}>
          Our team will verify your business within 2–3 business days and notify you once it's live on TruGoa.
        </p>
        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: theme.colors.primary, color: theme.colors.textPrimary,
              border: "none", borderRadius: theme.radii.pill,
              padding: "14px 28px", fontSize: 15,
              fontWeight: theme.typography.weightBold,
              fontFamily: theme.typography.fontBody, cursor: "pointer",
            }}
          >
            Return to dashboard
          </button>
          <button
            onClick={() => {
              setSubmitted(false); setStep(0);
              setImages([]); setImagePreviews([]);
              setForm({ name: "", location: "", category: "", price_range: "", trust_level: "risky", description: "", contact: "" });
            }}
            style={{
              background: "none", color: theme.colors.textMuted,
              border: "none", fontSize: 14, cursor: "pointer",
              fontFamily: theme.typography.fontBody,
            }}
          >
            Submit another listing
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: theme.colors.bgPage, minHeight: "100vh", fontFamily: theme.typography.fontBody }}>

      {/* ── PAGE HEADER ──────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.colors.secondaryDark} 0%, ${theme.colors.secondary} 100%)`,
        padding: `clamp(32px,5vh,48px) ${theme.spacing.pagePadding}`,
      }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
            color: "white", borderRadius: theme.radii.pill, padding: "8px 18px",
            cursor: "pointer", fontSize: 13, fontFamily: theme.typography.fontBody,
            fontWeight: theme.typography.weightMedium, marginBottom: 20,
          }}
        >
          ← Back
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{
            width: 56, height: 56, borderRadius: theme.radii.md,
            background: theme.colors.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, flexShrink: 0,
          }}>
            <Store size={26} />
          </div>
          <div>
            <h1 style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: "clamp(22px,3.5vw,36px)",
              fontWeight: theme.typography.weightBlack,
              color: "white", letterSpacing: "-0.5px", marginBottom: 6,
            }}>
              List Your Business on TruGoa
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", maxWidth: 520 }}>
              Join 500+ verified businesses trusted by thousands of tourists every month.
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: `clamp(24px,4vh,40px) ${theme.spacing.pagePadding}` }}>

        {/* ── STEP INDICATOR ─────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: theme.typography.weightBold,
                  background: i < step ? theme.colors.secondary : i === step ? theme.colors.primary : theme.colors.bgSurface,
                  color: i < step ? "white" : i === step ? theme.colors.textPrimary : theme.colors.textMuted,
                  border: i === step ? `2px solid ${theme.colors.primaryDark}` : i < step ? `2px solid ${theme.colors.secondary}` : `2px solid ${theme.colors.borderLight}`,
                  transition: theme.transitions.normal,
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: i === step ? theme.typography.weightMedium : theme.typography.weightRegular,
                  color: i === step ? theme.colors.textPrimary : theme.colors.textMuted,
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2,
                  background: i < step ? theme.colors.secondary : theme.colors.borderLight,
                  transition: theme.transitions.normal,
                  margin: "0 8px 20px",
                }} />
              )}
            </div>
          ))}
        </div>

        {/* ── FORM CARD ──────────────────────────────────── */}
        <div style={{
          background: theme.colors.bgCard,
          borderRadius: theme.radii.xl,
          border: `1px solid ${theme.colors.borderLight}`,
          boxShadow: theme.shadows.modal,
          overflow: "hidden",
        }}>

          {/* card header */}
          <div style={{
            background: theme.colors.bgSurface,
            borderBottom: `1px solid ${theme.colors.borderLight}`,
            padding: "20px 28px",
          }}>
            <div style={{
              fontSize: 11, fontWeight: theme.typography.weightMedium,
              color: theme.colors.textMuted, letterSpacing: "1px",
              textTransform: "uppercase", marginBottom: 4,
            }}>
              Step {step + 1} of {STEPS.length}
            </div>
            <div style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 20, fontWeight: theme.typography.weightBold,
              color: theme.colors.textPrimary,
            }}>
              {STEPS[step]}
            </div>
          </div>

          {/* card body */}
          <div style={{ padding: isMobile ? "20px 16px" : "28px" }}>

            {/* ── STEP 0: Business Info ─────────────────── */}
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

                {/* name */}
                <div>
                  <label style={labelStyle}>
                    Business Name <span style={{ color: theme.colors.danger }}>*</span>
                  </label>
                  <input
                    name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Britto's Restaurant"
                    style={inputStyle(errors.name)}
                    onFocus={e => e.target.style.borderColor = theme.colors.primary}
                    onBlur={e => e.target.style.borderColor = errors.name ? theme.colors.danger : theme.colors.borderLight}
                  />
                  {errors.name && <div style={errorStyle}>{errors.name}</div>}
                </div>

                {/* location */}
                <div>
                  <label style={labelStyle}>
                    Location <span style={{ color: theme.colors.danger }}>*</span>
                  </label>
                  <input
                    name="location" value={form.location} onChange={handleChange}
                    placeholder="e.g. Baga Beach, North Goa"
                    style={inputStyle(errors.location)}
                    onFocus={e => e.target.style.borderColor = theme.colors.primary}
                    onBlur={e => e.target.style.borderColor = errors.location ? theme.colors.danger : theme.colors.borderLight}
                  />
                  {errors.location && <div style={errorStyle}>{errors.location}</div>}
                </div>

                {/* contact */}
                <div>
                  <label style={labelStyle}>
                    Contact Number{" "}
                    <span style={{ color: theme.colors.textMuted, fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    name="contact" value={form.contact} onChange={handleChange}
                    placeholder="e.g. +91 98765 43210"
                    style={inputStyle(false)}
                    onFocus={e => e.target.style.borderColor = theme.colors.primary}
                    onBlur={e => e.target.style.borderColor = theme.colors.borderLight}
                  />
                </div>

                {/* description */}
                <div>
                  <label style={labelStyle}>
                    Short Description{" "}
                    <span style={{ color: theme.colors.textMuted, fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    name="description" value={form.description} onChange={handleChange}
                    placeholder="Tell tourists what makes your place special..."
                    rows={4}
                    style={{ ...inputStyle(false), resize: "vertical", minHeight: 100, lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = theme.colors.primary}
                    onBlur={e => e.target.style.borderColor = theme.colors.borderLight}
                  />
                </div>

                {/* ✅ PHOTOS — inside Step 0 */}
                <div>
                  <label style={labelStyle}>
                    Business Photos{" "}
                    <span style={{ color: theme.colors.textMuted, fontWeight: 400 }}>(up to 5 photos)</span>
                  </label>

                  {imagePreviews.length > 0 && (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                      gap: 10, marginBottom: 12,
                    }}>
                      {imagePreviews.map((src, i) => (
                        <div key={i} style={{ position: "relative" }}>
                          <img
                            src={src}
                            alt={`preview ${i + 1}`}
                            style={{
                              width: "100%", aspectRatio: "1",
                              objectFit: "cover",
                              borderRadius: theme.radii.md,
                              border: `1px solid ${theme.colors.borderLight}`,
                            }}
                          />
                          <button
                            onClick={() => removeImage(i)}
                            style={{
                              position: "absolute", top: 4, right: 4,
                              width: 22, height: 22, borderRadius: "50%",
                              background: "rgba(0,0,0,0.6)", color: "white",
                              border: "none", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: "bold",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length < 5 && (
                    <label style={{
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: 8, padding: "24px 16px",
                      border: `2px dashed ${errors.images ? theme.colors.danger : theme.colors.borderMedium}`,
                      borderRadius: theme.radii.lg,
                      background: theme.colors.bgPage,
                      cursor: "pointer",
                      transition: theme.transitions.fast,
                    }}>
                      <span style={{ fontSize: 28 }}>📷</span>
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: theme.typography.weightMedium,
                          color: theme.colors.textBody, marginBottom: 4,
                        }}>
                          Tap to add photos
                        </div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                          JPG, PNG or WebP · Max 5MB each · {5 - images.length} remaining
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  )}

                  {errors.images && <div style={errorStyle}>{errors.images}</div>}
                </div>

              </div> // ✅ closes Step 0
            )}

            {/* ── STEP 1: Category & Pricing ────────────── */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

                {/* category picker */}
                <div>
                  <label style={labelStyle}>
                    Business Category <span style={{ color: theme.colors.danger }}>*</span>
                  </label>
                  <div style={{
                    display: "grid",
                   gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: 10, marginTop: 8,
                  }}>
                    {CATEGORIES.map(cat => {
                      const isSelected = form.category === cat.value;
                      return (
                        <div
                          key={cat.value}
                          onClick={() => setPick("category", cat.value)}
                          style={{
                            display: "flex", flexDirection: "column",
                            alignItems: "center", gap: 6,
                            padding: "14px 10px",
                            borderRadius: theme.radii.md,
                            border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.borderLight}`,
                            background: isSelected ? theme.colors.primaryLight : theme.colors.bgPage,
                            cursor: "pointer",
                            transition: theme.transitions.fast,
                            textAlign: "center",
                          }}
                        >
                          <span style={{ fontSize: 22 }}>{cat.icon}</span>
                          <span style={{
                            fontSize: 12,
                            fontWeight: isSelected ? theme.typography.weightMedium : theme.typography.weightRegular,
                            color: isSelected ? theme.colors.primaryText : theme.colors.textBody,
                          }}>
                            {cat.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {errors.category && <div style={errorStyle}>{errors.category}</div>}
                </div>

                {/* price range picker */}
                <div>
                  <label style={labelStyle}>
                    Price Range <span style={{ color: theme.colors.danger }}>*</span>
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                    {PRICE_RANGES.map(pr => {
                      const isSelected = form.price_range === pr.value;
                      return (
                        <div
                          key={pr.value}
                          onClick={() => setPick("price_range", pr.value)}
                          style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "14px 16px",
                            borderRadius: theme.radii.md,
                            border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.borderLight}`,
                            background: isSelected ? theme.colors.primaryLight : theme.colors.bgPage,
                            cursor: "pointer",
                            transition: theme.transitions.fast,
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{pr.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 14,
                              fontWeight: isSelected ? theme.typography.weightMedium : theme.typography.weightRegular,
                              color: isSelected ? theme.colors.primaryText : theme.colors.textPrimary,
                            }}>
                              {pr.label}
                            </div>
                            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{pr.sub}</div>
                          </div>
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%",
                            border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.borderMedium}`,
                            background: isSelected ? theme.colors.primary : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {errors.price_range && <div style={errorStyle}>{errors.price_range}</div>}
                </div>

                {/* trust level */}
                <div>
                  <label style={labelStyle}>Listing Type</label>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    {[
                      { value: "risky",    label: "Standard",         sub: "Listed, pending review" },
                      { value: "verified", label: "Request Verified", sub: "Team will physically visit" },
                    ].map(tl => {
                      const isSelected = form.trust_level === tl.value;
                      return (
                        <div
                          key={tl.value}
                          onClick={() => setPick("trust_level", tl.value)}
                          style={{
                            flex: 1, padding: "14px 16px",
                            borderRadius: theme.radii.md,
                            border: `2px solid ${isSelected ? theme.colors.secondary : theme.colors.borderLight}`,
                            background: isSelected ? theme.colors.secondaryLight : theme.colors.bgPage,
                            cursor: "pointer",
                            transition: theme.transitions.fast,
                          }}
                        >
                          <div style={{
                            fontSize: 13,
                            fontWeight: isSelected ? theme.typography.weightMedium : theme.typography.weightRegular,
                            color: isSelected ? theme.colors.secondaryText : theme.colors.textPrimary,
                            marginBottom: 4,
                          }}>
                            {tl.label}
                          </div>
                          <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{tl.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Review & Submit ───────────────── */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Please review your details before submitting.
                </p>

                {/* summary */}
                <div style={{
                  background: theme.colors.bgSurface,
                  borderRadius: theme.radii.lg,
                  border: `1px solid ${theme.colors.borderLight}`,
                  overflow: "hidden",
                }}>
                  {[
                    { label: "Business Name", value: form.name },
                    { label: "Location",       value: form.location },
                    { label: "Category",       value: CATEGORIES.find(c => c.value === form.category)?.label || "—" },
                    { label: "Price Range",    value: PRICE_RANGES.find(p => p.value === form.price_range)?.label || "—" },
                    { label: "Listing Type",   value: form.trust_level === "verified" ? "Request Verified" : "Standard" },
                    { label: "Contact",        value: form.contact || "—" },
                    { label: "Description",    value: form.description || "—" },
                    { label: "Photos",         value: images.length > 0 ? `${images.length} photo${images.length > 1 ? "s" : ""} selected` : "None" },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{
                      display: "flex", gap: 16, flexWrap: "wrap",
                      padding: "14px 18px",
                      borderBottom: i < arr.length - 1 ? `1px solid ${theme.colors.borderLight}` : "none",
                    }}>
                      <div style={{
                        fontSize: 12, color: theme.colors.textMuted,
                        fontWeight: theme.typography.weightMedium,
                        minWidth: 110, flexShrink: 0,
                      }}>
                        {row.label}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textPrimary, flex: 1, lineHeight: 1.5 }}>
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* photo previews on review step */}
                {imagePreviews.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    gap: 8,
                  }}>
                    {imagePreviews.map((src, i) => (
                      <img
                        key={i} src={src} alt={`photo ${i + 1}`}
                        style={{
                          width: "100%", aspectRatio: "1",
                          objectFit: "cover",
                          borderRadius: theme.radii.md,
                          border: `1px solid ${theme.colors.borderLight}`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* trust notice */}
                <div style={{
                  background: theme.colors.secondaryLight,
                  border: `1px solid ${theme.colors.secondary}30`,
                  borderRadius: theme.radii.md,
                  padding: "14px 16px",
                  fontSize: 13, color: theme.colors.secondaryText, lineHeight: 1.7,
                }}>
                  🛡️ <strong>Our Promise:</strong> TruGoa reviews every listing before it goes live.
                  We protect tourists from fake businesses — and genuine businesses from unfair competition.
                </div>

                {errors.submit && (
                  <div style={{
                    background: theme.colors.dangerBg,
                    border: `1px solid ${theme.colors.danger}40`,
                    borderRadius: theme.radii.md,
                    padding: "12px 16px",
                    fontSize: 13, color: theme.colors.danger,
                  }}>
                    {errors.submit}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── CARD FOOTER ──────────────────────────────── */}
          <div style={{
           padding: isMobile ? "16px" : "20px 28px",
           borderTop: `1px solid ${theme.colors.borderLight}`,
           background: theme.colors.bgSurface,
            display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 12, flexWrap: "wrap",
          }}>
            {step > 0 ? (
              <button
                onClick={prevStep}
                style={{
                  background: "none",
                  border: `1.5px solid ${theme.colors.borderLight}`,
                  borderRadius: theme.radii.pill,
                  padding: "11px 24px", fontSize: 14,
                  fontWeight: theme.typography.weightMedium,
                  fontFamily: theme.typography.fontBody,
                  color: theme.colors.textBody, cursor: "pointer",
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = theme.colors.borderMedium}
                onMouseLeave={e => e.currentTarget.style.borderColor = theme.colors.borderLight}
              >
                ← Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                style={{
                  background: theme.colors.primary, color: theme.colors.textPrimary,
                  border: "none", borderRadius: theme.radii.pill,
                  padding: "12px 32px", fontSize: 14,
                  fontWeight: theme.typography.weightBold,
                  fontFamily: theme.typography.fontBody,
                  cursor: "pointer", transition: theme.transitions.normal,
                }}
                onMouseEnter={e => e.currentTarget.style.background = theme.colors.primaryDark}
                onMouseLeave={e => e.currentTarget.style.background = theme.colors.primary}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: submitting ? theme.colors.borderLight : theme.colors.secondary,
                  color: submitting ? theme.colors.textMuted : "white",
                  border: "none", borderRadius: theme.radii.pill,
                  padding: "12px 32px", fontSize: 14,
                  fontWeight: theme.typography.weightBold,
                  fontFamily: theme.typography.fontBody,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: theme.transitions.normal,
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = theme.colors.secondaryDark; }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = theme.colors.secondary; }}
              >
                {submitting
                  ? uploadingImages ? "Uploading photos..." : "Submitting..."
                  : " Submit Listing"
                  }

           
              </button>
            )}
          </div>
        </div>

        {/* bottom trust strip */}
        <div style={{
          display: "flex", gap: 24, justifyContent: "center",
          flexWrap: "wrap", marginTop: 28, paddingBottom: 40,
        }}>
          {["🔒 Secure submission", "✓ Reviewed within 48hrs", "🌿 100% free to list"].map(item => (
            <div key={item} style={{ fontSize: 12, color: theme.colors.textMuted }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── style helpers ────────────────────────────────────────────
const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: "#1A1F1C", marginBottom: 8, letterSpacing: "0.1px",
};

const inputStyle = (hasError) => ({
  width: "100%", padding: "12px 14px", borderRadius: "10px",
  border: `1.5px solid ${hasError ? "#C0392B" : "#E5E0D8"}`,
  background: "#FAFAF7", fontSize: 14, color: "#1A1F1C",
  outline: "none", fontFamily: "'Instrument Sans', sans-serif",
  transition: "border-color 0.15s ease", boxSizing: "border-box",
});

const errorStyle = {
  fontSize: 12, color: "#C0392B", marginTop: 6,
  display: "flex", alignItems: "center", gap: 4,
};

export default AddBusiness;