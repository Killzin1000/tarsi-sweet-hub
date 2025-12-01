import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/quicksand/300.css";
import "@fontsource/quicksand/400.css";
import "@fontsource/quicksand/500.css";
import "@fontsource/quicksand/600.css";
import "@fontsource/quicksand/700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
