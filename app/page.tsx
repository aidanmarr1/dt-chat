import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GateForm from "@/components/GateForm";

export default async function GatePage() {
  const cookieStore = await cookies();
  const gatePassed = cookieStore.get("gate-passed");

  if (gatePassed) {
    redirect("/auth");
  }

  return <GateForm />;
}
