import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { NewTeamClient } from "./NewTeamClient";

export default async function NewTeamPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return <NewTeamClient />;
}
