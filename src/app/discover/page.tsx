import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DiscoverClient } from "./DiscoverClient";

export default async function DiscoverPage() {
  const user = await getCurrentUser();

  // If user is not authenticated, never render Discover page — redirect to login
  if (!user) {
    redirect("/login");
  }

  return <DiscoverClient initialUser={user} />;
}
