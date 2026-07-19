import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import { initUserPreferences } from "./lib/user-preferences.js";
import "./styles.css";

initUserPreferences();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
