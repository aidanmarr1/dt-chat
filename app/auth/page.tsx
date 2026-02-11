import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function AuthPage() {
  const cookieStore = await cookies();
  const gatePassed = cookieStore.get("gate-passed");

  if (!gatePassed) {
    redirect("/");
  }

  const user = await getCurrentUser();
  if (user) {
    redirect("/chat");
  }

  return <AuthForm />;
}
