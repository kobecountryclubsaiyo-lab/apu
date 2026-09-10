import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUser } from "@/lib/serialize";
import NavBar from "@/components/NavBar";
import ReportList from "@/components/ReportList";

export default async function AdminReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/themes");

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    include: { reporter: true, targetUser: true, room: true },
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-6 bg-[#0F1226]">
      <NavBar user={publicUser(user)} />
      <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper text-ink shadow-2xl">
        <div className="px-5 pt-6 pb-5 bg-night text-paper">
          <p className="font-heading font-bold text-lg">通報の確認</p>
          <p className="text-[11px] mt-1 text-[#C9C3B4]">未対応の通報を確認・対応します</p>
        </div>
        <ReportList
          reports={reports.map((r) => ({
            id: r.id,
            reason: r.reason,
            createdAt: r.createdAt.toISOString(),
            reporterName: r.reporter.name,
            targetUserName: r.targetUser.name,
            roomName: r.room?.name ?? null,
          }))}
        />
      </div>
    </div>
  );
}
