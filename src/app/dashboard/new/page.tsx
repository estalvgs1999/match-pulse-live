import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { NewProjectClient } from "./NewProjectClient";

export default async function NewProjectPage() {
  if (!(await isAuthenticated())) {
    redirect("/login?next=/dashboard/new");
  }
  return <NewProjectClient />;
}
