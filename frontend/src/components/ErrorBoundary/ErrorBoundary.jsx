import { Component } from "react";

// The app's last line of defence. React unmounts the whole tree when a render
// or lifecycle error escapes uncaught, so without a boundary anywhere, one
// throw anywhere produced a permanently blank page with nothing on screen to
// act on — the visitor's only way out was clearing site data by hand.
//
// Deliberately dependency-free: no theme import, no router, no context, styles
// inline. A fallback that reaches for the same modules the failure may have
// come from can fail while rendering the failure, which puts the blank page
// straight back.
//
// Error boundaries have to be class components — there is still no hook
// equivalent of componentDidCatch.
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error", error, info?.componentStack);
  }

  // Most crashes that survive a reload are a bad value in storage, which is
  // exactly what the visitor cannot clear from inside the page. Wiping the
  // app's own keys is enough — site-wide data is left alone.
  handleReset = () => {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("trugoa_")) localStorage.removeItem(key);
      }
    } catch {
      // Storage can throw outright in a private window or with site data
      // blocked. Reloading is still worth attempting.
    }
    window.location.assign("/");
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={S.page} role="alert">
        <div style={S.card}>
          <h1 style={S.title}>Something went wrong</h1>
          <p style={S.body}>
            This page ran into an error and couldn&apos;t finish loading. Reloading
            usually fixes it.
          </p>
          <div style={S.row}>
            <button style={S.primary} onClick={() => window.location.reload()}>
              Reload the page
            </button>
            <button style={S.secondary} onClick={this.handleReset}>
              Reset and start over
            </button>
          </div>
          <p style={S.hint}>
            &ldquo;Reset&rdquo; signs you out and clears TruGoa&apos;s saved data on this
            device. Nothing on your account is deleted.
          </p>

          {import.meta.env.DEV && (
            <pre style={S.details}>
              {this.state.error?.stack || String(this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#faf8f5",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    color: "#1c1917",
  },
  card: { maxWidth: 520, width: "100%", textAlign: "center" },
  title: { fontSize: 24, fontWeight: 600, margin: "0 0 12px" },
  body: { fontSize: 15, lineHeight: 1.6, color: "#57534e", margin: "0 0 24px" },
  row: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  primary: {
    padding: "10px 20px", fontSize: 15, borderRadius: 8, cursor: "pointer",
    border: "1px solid #1c1917", background: "#1c1917", color: "#fff",
  },
  secondary: {
    padding: "10px 20px", fontSize: 15, borderRadius: 8, cursor: "pointer",
    border: "1px solid #d6d3d1", background: "transparent", color: "#1c1917",
  },
  hint: { fontSize: 13, color: "#78716c", margin: "20px 0 0", lineHeight: 1.5 },
  details: {
    marginTop: 24, padding: 12, textAlign: "left", fontSize: 12, lineHeight: 1.5,
    background: "#f5f5f4", border: "1px solid #e7e5e4", borderRadius: 8,
    overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
  },
};

export default ErrorBoundary;
