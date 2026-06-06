import "./globals.css";

export function generateMetadata() {
  const d = new Date();
  const ym = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}`;
  const icon = `https://www.gstatic.com/images/branding/productlogos/calendar_${ym}/v2/png/calendar_${ym}_96dp.png`;
  return {
    title: "Google Calendar Clone",
    description: "Google Calendar Clone",
    icons: { icon },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Apply persisted theme + density before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('themePreference');if(t==='dark')document.documentElement.classList.add('dark');else if(t==='light')document.documentElement.classList.remove('dark');else if(t==='device'&&matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark');if(localStorage.getItem('densityPreference')==='compact')document.documentElement.classList.add('density-compact');if(localStorage.getItem('colorSetPreference')==='classic')document.documentElement.classList.add('colorset-classic');}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
