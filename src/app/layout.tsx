import "./globals.css";

export const metadata = {
  title: "Audioblog",
  description: "Recordings",
  openGraph: {
    title: 'Audioblog',
    description: 'What are we talking about?',
    url: 'https://audio.joaqu.im',
    siteName: 'Audioblog',
    images: [
      {
        url: 'https://audio.joaqu.im/logo.png',
        width: 192,
        height: 192,
      },
    ],
    locale: 'en-GB',
    type: 'website',
  },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
