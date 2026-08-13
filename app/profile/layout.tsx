import { requireVerifiedUser } from "../../lib/auth-guard";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  await requireVerifiedUser();
  return <>{children}</>;
}
