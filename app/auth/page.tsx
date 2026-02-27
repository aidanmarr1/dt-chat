import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";
import { verifyGateCookie } from "../api/gate/route";

export default async function AuthPage() {
  const cookieStore = await cookies();
  const gatePassed = verifyGateCookie(cookieStore.get("gate-passed")?.value);

  if (!gatePassed) {
    redirect("/");
  }

  const user = await getCurrentUser();
  if (user) {
    redirect("/chat");
  }

  return <AuthForm />;
}
