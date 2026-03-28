import { ReactNode, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-lg font-semibold">Cyber Chief</div>
          </div>
        </header>

        <main className="p-4">{children}</main>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="p-0">
            <div className="h-full">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Menu</div>
                  <DrawerClose asChild>
                    <button className="p-2 rounded-md hover:bg-muted transition-colors">Close</button>
                  </DrawerClose>
                </div>
              </div>
              <div className="p-2">
                <DashboardSidebar />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
