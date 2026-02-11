import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ChatRoom from "@/components/ChatRoom";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const gatePassed = cookieStore.get("gate-passed");

  if (!gatePassed) {
    redirect("/");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  return <ChatRoom />;
}
