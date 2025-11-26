import React from "react";

function App() {
  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "white",
      }}
    >
      <div style={{ maxWidth: 700, padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          ERG Recruitment Suite
        </h1>
        <p style={{ fontSize: "1rem", lineHeight: 1.5, marginBottom: "1rem" }}>
          This is a basic placeholder page deployed via Netlify.
        </p>
        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          Next step: we’ll swap this placeholder for your full Claude-generated
          interface.
        </p>
      </div>
    </div>
  );
}

export default App;
