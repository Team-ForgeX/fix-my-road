import { requireVerifiedUser } from "../../lib/auth-guard";

export default async function ReportLayout({ children }: { children: React.ReactNode }) {
  await requireVerifiedUser();
  return <>{children}</>;
}
