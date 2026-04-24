import { UnitWorkspaceShell } from "@/components/dashboard/unit/unit-workspace-shell"

export default function UnidadDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <UnitWorkspaceShell>{children}</UnitWorkspaceShell>
}
