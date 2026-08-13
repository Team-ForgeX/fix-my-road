import { redirect } from "next/navigation";
import { requireVerifiedUser } from "../../lib/auth-guard";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireVerifiedUser();
  return <>{children}</>;
}
