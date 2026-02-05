import "./globals.css";
import { ThemeProvider } from "next-themes";
import TopNav from "@/components/ui/top-nav";



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TopNav/>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
