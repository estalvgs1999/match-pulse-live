import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { TeamEditorClient } from "./TeamEditorClient";

export default async function TeamEditorPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/login");
  const { teamId } = await params;
  return <TeamEditorClient teamId={teamId} />;
}
