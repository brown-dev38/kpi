import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./Provider";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "./motion-provider";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "ระบบรายงานตัวชี้วัด - คณะแพทยศาสตร์ มหาวิทยาลัยพะเยา",
  description: "ระบบรายงานตัวชี้วัด - คณะแพทยศาสตร์ มหาวิทยาลัยพะเยา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className="antialiased">
        <AuthProvider>
          <MotionProvider>{children}</MotionProvider>
        </AuthProvider>
        <Toaster
          richColors
          position="top-center"
          toastOptions={{ className: prompt.className }}
        />
      </body>
    </html>
  );
}
