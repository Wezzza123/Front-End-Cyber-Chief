import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply stored theme before React renders so initial paint matches the user's choice.
if (typeof window !== "undefined") {
  try {
    const theme = localStorage.getItem("theme");
    if (theme === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }
  } catch {
    // If localStorage is not available, fall back to the current default (dark).
  }
}

createRoot(document.getElementById("root")!).render(<App />);
