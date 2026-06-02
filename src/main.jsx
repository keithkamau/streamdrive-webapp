import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

// ── Global error boundary ─────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Structured log — swap for Sentry/LogRocket when uptime monitoring is added
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "DM Sans, sans-serif",
            gap: "1rem",
          }}
        >
          <svg
            width='48'
            height='48'
            viewBox='0 0 24 24'
            fill='none'
            stroke='#ef4444'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='8' x2='12' y2='12' />
            <line x1='12' y1='16' x2='12.01' y2='16' />
          </svg>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#18181b",
              margin: 0,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#71717a",
              margin: 0,
              textAlign: "center",
              maxWidth: 360,
            }}
          >
            An unexpected error occurred. Try refreshing the page — if the
            problem persists, contact your estate administrator.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "1rem",
                fontSize: "0.75rem",
                color: "#991b1b",
                maxWidth: 560,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1.5rem",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      {/*
        ThemeProvider must be outside AuthProvider so the dark-mode class
        is applied to <html> before any authenticated UI renders.
        AuthProvider must wrap App so every useAuth() call has a context.
      */}
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
