import Link from "next/link";
import "./globals.css";

import styles from "./layout.module.css";

export const metadata = {
  title: "Spoken Words",
  description: "Recordings",
  openGraph: {
    title: "Spoken Words",
    description: "Listen and answer.",
    url: "https://audio.joaqu.im",
    siteName: "Spoken Words",
    images: [
      {
        url: "https://audio.joaqu.im/logo.png",
        width: 192,
        height: 192,
      },
    ],
    locale: "en-GB",
    type: "website",
  },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={styles.body}>
        <div className={styles.children}>{children}</div>
        <footer className={styles.footer}>
          <Link href="/terms">Terms and Conditions</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </footer>
      </body>
    </html>
  );
};

export default RootLayout;
