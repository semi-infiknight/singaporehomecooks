import { CookLoginGate } from '../components/CookLoginGate';

export default function CookPortalLayout({ children }: { children: React.ReactNode }) {
  return <CookLoginGate>{children}</CookLoginGate>;
}