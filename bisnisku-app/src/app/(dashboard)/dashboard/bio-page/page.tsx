import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/auth-actions";
import { BioEditorShell } from "@/components/bio-editor/bio-editor-shell";

export const metadata = {
  title: "Bio Page Editor",
};

export default async function BioEditorPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return <BioEditorShell />;
}
