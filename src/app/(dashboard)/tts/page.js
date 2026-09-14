import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { getTTSList } from "@/app/actions/ttsActions";
import TTSBuilderClient from "./TTSBuilderClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TTS (Teka-Teki Silang) Builder | SRE Portal",
  description: "Form builder teka-teki silang dengan penataan otomatis layout mendatar dan menurun.",
};

export default async function TTSDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const listRes = await getTTSList();

  return (
    <div className="w-full">
      <TTSBuilderClient
        initialTTSList={listRes.data || []}
        currentUser={session.user}
      />
    </div>
  );
}
