import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Penugasan TTS | SRE UPNVJT",
  description: "Penugasan dan game Teka-Teki Silang interaktif SRE UPN Veteran Jawa Timur.",
};

export default async function TTSGamesIndexPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams?.id;

  // If specific ID is requested via query param ?id=..., forward to the dedicated puzzle route
  if (id) {
    redirect(`/games/tts/${id}`);
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/member/tugas");
  }

  const role = (session.user.roleName || "").toUpperCase();
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "STAFF") {
    redirect("/tts");
  }

  // Members are directly guided to their assignment page
  redirect("/member/tugas");
}
