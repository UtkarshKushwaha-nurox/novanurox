import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="font-display text-7xl font-bold text-gradient-neon">404</div>
        <h1 className="mt-4 font-display text-2xl font-bold">Lost in the matrix</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gradient-neon px-5 h-11 text-sm font-semibold text-background shadow-neon"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0a0f1f" },
      { title: "Nova Nurox — The 10-Day AI Co-Pilot Challenge" },
      {
        name: "description",
        content:
          "Stop being a User. Become a Creator. Master AI Co-Pilots in 10 days with India's most futuristic AI Masterclass — Nova Nurox. Alpha Batch ₹149.",
      },
      { name: "author", content: "Nova Nurox" },
      { property: "og:title", content: "Nova Nurox — The 10-Day AI Co-Pilot Challenge" },
      {
        property: "og:description",
        content:
          "Don't just use AI, Co-Pilot it. Join the Alpha Batch — limited to 20 students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nova Nurox — The 10-Day AI Co-Pilot Challenge" },
      { name: "description", content: "Nurox AI Creator Hub empowers users to become AI creators through an AI-first educational platform." },
      { property: "og:description", content: "Nurox AI Creator Hub empowers users to become AI creators through an AI-first educational platform." },
      { name: "twitter:description", content: "Nurox AI Creator Hub empowers users to become AI creators through an AI-first educational platform." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d11977e6-eb4c-4714-ab3c-3b1f7ce13cc3/id-preview-07ab20f2--72e34662-a315-47f8-91ae-656f147bcf92.lovable.app-1776950677336.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d11977e6-eb4c-4714-ab3c-3b1f7ce13cc3/id-preview-07ab20f2--72e34662-a315-47f8-91ae-656f147bcf92.lovable.app-1776950677336.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
