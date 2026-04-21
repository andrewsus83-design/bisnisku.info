import { redirect } from "next/navigation";

/** Redirect old /bio-editor → /dashboard/bio-page */
export default function BioEditorRedirect() {
  redirect("/dashboard/bio-page");
}
