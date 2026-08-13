import { redirect } from "next/navigation";
import { requireAdminUser } from "../../lib/auth-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();
  return <>{children}</>;
}
