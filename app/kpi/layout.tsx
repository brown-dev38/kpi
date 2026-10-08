import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/auth";
import { AuthProvider } from "../Provider";
import AppsideBar from "./_components/sidebar";

export default async function KpiLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Seed the client session from the server so the sidebar renders its menus on
  // the first paint after login. Without this the redirect out of /login is a
  // client-side navigation and SessionProvider would still hold a null session.
  const session = await auth();

  return (
    <AuthProvider session={session}>
      <SidebarProvider
        style={{
          "--sidebar-width": "18rem",
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties}
      >
        <AppsideBar />
        {children}
      </SidebarProvider>
    </AuthProvider>
  );
}
