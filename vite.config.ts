import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import os from "os";

// Place Vite's cache outside OneDrive to avoid locking issues on Windows
const userCacheRoot =
  process.env.LOCALAPPDATA ||
  process.env.XDG_CACHE_HOME ||
  path.join(os.homedir(), ".cache");
const viteCacheDir = path.join(userCacheRoot, "vite", "public-health-dash");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use the repository name when deploying to GitHub Pages
  base: mode === "development" ? "/" : "/public-health-dash/",
  server: {
    host: "::",
    port: 8080,
  },
  // Avoid OneDrive/antivirus interfering with node_modules/.vite during prebundle
  cacheDir: viteCacheDir,
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
