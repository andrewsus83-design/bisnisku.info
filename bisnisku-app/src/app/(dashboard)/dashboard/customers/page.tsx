import { redirect } from "next/navigation";

/** Redirect old /dashboard/customers → /dashboard/crm */
export default function CustomersRedirect() {
  redirect("/dashboard/crm");
}
