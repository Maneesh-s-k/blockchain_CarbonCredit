import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Buffer } from 'buffer';
import process from 'process';
import App from "./App.jsx";
import "./styles/main.css";

window.Buffer = Buffer;
window.process = process;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
