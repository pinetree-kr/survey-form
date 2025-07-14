import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// NotoSansKR
const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKR.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
