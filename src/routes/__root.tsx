/**
 * @module __root
 * Root layout for the application.
 * Integrates Google Analytics (GA4), security headers (CSP),
 * and the application shell including fonts and global styles.
 */
import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

/** Google Analytics Measurement ID */
const GA_MEASUREMENT_ID = "G-4C663B9997";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-destructive">Something went wrong</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          An unexpected error occurred. Please try refreshing the page.
        </p>
        <div className="mt-8">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Voting Oracle — India Election Guide" },
      {
        name: "description",
        content:
          "A calm, beautiful guide to voting in India. Track your progress, find your polling booth, and ask the AI Oracle.",
      },
      { name: "author", content: "The Voting Oracle" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        httpEquiv: "Content-Security-Policy",
        content:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://rsms.me https://fonts.googleapis.com; img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://maps.google.com https://cdnjs.cloudflare.com; connect-src 'self' https://*.googleapis.com https://*.google-analytics.com https://www.google-analytics.com https://analytics.google.com; font-src 'self' https://rsms.me https://fonts.gstatic.com; frame-src https://www.google.com https://maps.google.com;",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://rsms.me/" },
      { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
    ],
    scripts: [
      {
        src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`,
        async: true,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        {/* Google Analytics initialization */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_title: document.title,
                send_page_view: true,
              });
            `,
          }}
        />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
