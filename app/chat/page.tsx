import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ChatRoom from "@/components/ChatRoom";
import { verifyGateCookie } from "../api/gate/route";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const gatePassed = verifyGateCookie(cookieStore.get("gate-passed")?.value);

  if (!gatePassed) {
    redirect("/");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  return <ChatRoom />;
}
