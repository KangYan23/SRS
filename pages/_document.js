import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Viewport for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />

        {/* Theme Color */}
        <meta name="theme-color" content="#4180de" />

        {/* iOS Support */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SRS" />

        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Smart Referral System" />

        {/* Additional mobile optimizations */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="email=no" />
        <meta name="msapplication-TileColor" content="#4180de" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />

        {/* Prevent text zoom on input focus (iOS) */}
        <style>{`
          input[type="text"],
          input[type="email"],
          input[type="number"],
          textarea,
          select {
            font-size: 16px !important;
          }
        `}</style>
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
