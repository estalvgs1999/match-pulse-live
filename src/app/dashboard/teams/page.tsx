import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { TeamsClient } from "./TeamsClient";

export default async function TeamsPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return <TeamsClient />;
}
