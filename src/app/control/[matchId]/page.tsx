import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LiveConsole } from "./LiveConsole";

export default async function ControlPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  if (!(await isAuthenticated())) {
    redirect(`/login?next=/control/${matchId}`);
  }

  return <LiveConsole matchId={matchId} />;
}
