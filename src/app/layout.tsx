import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ReduxProvider from "@/lib/redux/ReduxProvider";
import SessionBootstrap from "@/lib/redux/SessionBootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Osbias",
  description: "Tool designed to make people better thinkers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased grid grid-cols-[1fr_3fr_1fr]`}
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen overflow-hidden`}
      >
        <ReduxProvider>
          <SessionBootstrap />
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* <AdminHeader user={session.user} /> */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
              {children}
            </main>
          </div>
          {/* <div></div> */}
        </ReduxProvider>
      </body>
    </html>
  );
}
