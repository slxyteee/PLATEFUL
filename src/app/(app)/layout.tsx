import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "User";

  return (
    <div className="flex flex-col min-h-screen">
      <Nav displayName={displayName} avatarUrl={profile?.avatar_url} />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
    </div>
  );
}
