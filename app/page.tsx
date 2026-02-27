import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GateForm from "@/components/GateForm";
import { verifyGateCookie } from "./api/gate/route";

export default async function GatePage() {
  const cookieStore = await cookies();
  const gatePassed = verifyGateCookie(cookieStore.get("gate-passed")?.value);

  if (gatePassed) {
    redirect("/auth");
  }

  return <GateForm />;
}
