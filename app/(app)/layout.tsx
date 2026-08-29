import BottomNav from "@/components/BottomNav";
import { CurrentProfileProvider } from "@/components/CurrentProfileProvider";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrentProfileProvider>
      <div className="min-h-dvh flex flex-col">
        <div className="app-gradient-bg flex-1 flex flex-col">
          <div className="flex-1 pb-28">{children}</div>
        </div>
        <BottomNav />
      </div>
    </CurrentProfileProvider>
  );
}
