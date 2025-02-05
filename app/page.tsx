import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  } else {
    redirect("/weekly-commission");
  }
}