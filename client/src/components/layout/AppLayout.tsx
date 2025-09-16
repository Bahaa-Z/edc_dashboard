import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
