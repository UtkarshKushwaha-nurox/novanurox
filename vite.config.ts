import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

const founderSchema = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nova Nurox",
  "url": "https://novanurox.onrender.com",
  "founder": {
    "@type": "Person",
    "name": "Utkarsh Kushwaha",
    "jobTitle": "Founder",
    "sameAs": ["PASTE_YOUR_LINKEDIN_URL_HERE"]
  }
}
</script>`;

function injectFounderSchema(): Plugin {
  return {
    name: "inject-founder-schema",
    transformIndexHtml(html) {
      return html.replace("</head>", `${founderSchema}\n</head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths(), injectFounderSchema()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
});
