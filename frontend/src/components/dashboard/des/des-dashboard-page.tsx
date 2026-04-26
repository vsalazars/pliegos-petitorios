"use client"

import { useEffect, useState } from "react"

import { DESOperationalDashboard } from "@/components/dashboard/des/des-operational-dashboard"
import { DESUserCreateForm } from "@/components/dashboard/des/des-user-create-form"
import { DESUserList } from "@/components/dashboard/des/des-user-list"
import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell"
import { DashboardState } from "@/components/dashboard/shared/dashboard-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AuthUser } from "@/lib/auth"
import { type DESAccountScope, type DESRole, type DESUnidad, type DESUser } from "@/lib/des-admin"
import type { DESDashboardOperationalData } from "@/lib/des-dashboard"

type DESAdminResponse = {
  user: AuthUser
  unidades: DESUnidad[]
  roles: DESRole[]
  usuarios: DESUser[]
}

type DESViewMode = "admin" | "operational"

export function DESDashboardPage() {
  const [viewMode, setViewMode] = useState<DESViewMode>("operational")
  const [data, setData] = useState<DESAdminResponse | null>(null)
  const [operationalData, setOperationalData] = useState<DESDashboardOperationalData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accountScope, setAccountScope] = useState<DESAccountScope>("UNIDAD")

  const load = async () => {
    try {
      const [meResponse, unidadesResponse, rolesResponse, usuariosResponse] =
        await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/admin/unidades", { cache: "no-store" }),
          fetch("/api/admin/roles", { cache: "no-store" }),
          fetch("/api/admin/usuarios", { cache: "no-store" }),
        ])

      const [mePayload, unidadesPayload, rolesPayload, usuariosPayload] = await Promise.all([
        meResponse.json(),
        unidadesResponse.json(),
        rolesResponse.json(),
        usuariosResponse.json(),
      ])

      if (!meResponse.ok) {
        setError(mePayload.error ?? "No fue posible validar la sesión DES.")
        return
      }
      if (!unidadesResponse.ok) {
        setError(unidadesPayload.error ?? "No fue posible cargar unidades.")
        return
      }
      if (!rolesResponse.ok) {
        setError(rolesPayload.error ?? "No fue posible cargar roles.")
        return
      }
      if (!usuariosResponse.ok) {
        setError(usuariosPayload.error ?? "No fue posible cargar usuarios.")
        return
      }

      setViewMode("admin")
      setError(null)
      setData({
        user: mePayload.user as AuthUser,
        unidades: (unidadesPayload.items ?? []) as DESUnidad[],
        roles: (rolesPayload.items ?? []) as DESRole[],
        usuarios: (usuariosPayload.items ?? []) as DESUser[],
      })
    } catch {
      setError("No fue posible conectar con la administración DES.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    const loadInitial = async () => {
      try {
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" })
        const mePayload = await meResponse.json()

        if (!isActive) {
          return
        }

        if (!meResponse.ok) {
          setError(mePayload.error ?? "No fue posible validar la sesión DES.")
          return
        }

        const user = mePayload.user as AuthUser

        if (user.rol_clave === "SUPERADMIN_DES") {
          const [unidadesResponse, rolesResponse, usuariosResponse] = await Promise.all([
            fetch("/api/admin/unidades", { cache: "no-store" }),
            fetch("/api/admin/roles", { cache: "no-store" }),
            fetch("/api/admin/usuarios", { cache: "no-store" }),
          ])

          const [unidadesPayload, rolesPayload, usuariosPayload] = await Promise.all([
            unidadesResponse.json(),
            rolesResponse.json(),
            usuariosResponse.json(),
          ])

          if (!isActive) {
            return
          }

          if (!unidadesResponse.ok) {
            setError(unidadesPayload.error ?? "No fue posible cargar unidades.")
            return
          }
          if (!rolesResponse.ok) {
            setError(rolesPayload.error ?? "No fue posible cargar roles.")
            return
          }
          if (!usuariosResponse.ok) {
            setError(usuariosPayload.error ?? "No fue posible cargar usuarios.")
            return
          }

          setViewMode("admin")
          setOperationalData(null)
          setError(null)
          setData({
            user,
            unidades: (unidadesPayload.items ?? []) as DESUnidad[],
            roles: (rolesPayload.items ?? []) as DESRole[],
            usuarios: (usuariosPayload.items ?? []) as DESUser[],
          })
          return
        }

        const dashboardResponse = await fetch("/api/admin/dashboard", { cache: "no-store" })
        const dashboardPayload = await dashboardResponse.json()

        if (!isActive) {
          return
        }

        if (!dashboardResponse.ok) {
          setError(dashboardPayload.error ?? "No fue posible cargar el dashboard DES.")
          return
        }

        setViewMode("operational")
        setError(null)
        setData(null)
        setOperationalData(dashboardPayload as DESDashboardOperationalData)
      } catch {
        if (isActive) {
          setError("No fue posible conectar con el módulo DES.")
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadInitial()

    return () => {
      isActive = false
    }
  }, [])

  if (isLoading) {
    return (
      <DashboardShell
        badge="DES"
        title="Dashboard DES"
        subtitle="Estamos cargando la vista correspondiente a tu perfil DES."
      >
        <DashboardState
          title="Cargando módulo DES"
          description="Estamos preparando la administración o el tablero operativo según tu perfil."
        />
      </DashboardShell>
    )
  }

  if (error || (viewMode === "admin" && !data) || (viewMode === "operational" && !operationalData)) {
    return (
      <DashboardShell
        badge="DIRECCIÓN DE EDUCACIÓN SUPERIOR"
        title="Dashboard DES"
        subtitle="Este espacio concentra administración de accesos y supervisión operativa DES."
      >
        <DashboardState
          title="No pudimos abrir el módulo DES"
          description={error ?? "Intenta recargar la sesión."}
        />
      </DashboardShell>
    )
  }

  if (viewMode === "operational" && operationalData) {
    return (
      <DashboardShell
        badge="DIRECCIÓN DE EDUCACIÓN SUPERIOR"
        title="Validación de las acciones de atención a los pliegos petitorios"
        widthClassName="w-[90%] max-w-[1800px]"
        lockViewport
      >
        <DESOperationalDashboard dashboard={operationalData} />
      </DashboardShell>
    )
  }

  if (!data) {
    return null
  }

  const users = [...data.usuarios].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )

  return (
    <DashboardShell
      badge="Dirección de Educación Superior"
      title="Administración de cuentas de acceso"
      subtitle="Alta rápida de cuentas para unidades académicas y revisión del acceso ya asignado."
    >
      <div className="space-y-6">
        <Tabs
          value={accountScope}
          onValueChange={(value) => setAccountScope(value as DESAccountScope)}
          className="space-y-6"
        >
          <TabsList
            variant="line"
            className="rounded-full bg-[#f7f1f3] p-1 text-[#7a7a81]"
          >
            <TabsTrigger
              value="UNIDAD"
              className="rounded-full px-4 py-2 data-active:bg-white data-active:text-[#5f1024]"
            >
              Cuentas de unidad
            </TabsTrigger>
            <TabsTrigger
              value="DES"
              className="rounded-full px-4 py-2 data-active:bg-white data-active:text-[#5f1024]"
            >
              Cuentas DES
            </TabsTrigger>
          </TabsList>

          <TabsContent value="UNIDAD">
            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <DESUserCreateForm
                unidades={data.unidades}
                roles={data.roles}
                scope="UNIDAD"
                disabled={data.user.rol_clave !== "SUPERADMIN_DES"}
                onCreated={load}
              />
              <DESUserList
                users={users}
                unidades={data.unidades}
                roles={data.roles}
                scope="UNIDAD"
                disabled={data.user.rol_clave !== "SUPERADMIN_DES"}
                onSaved={load}
              />
            </section>
          </TabsContent>

          <TabsContent value="DES">
            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <DESUserCreateForm
                unidades={data.unidades}
                roles={data.roles}
                scope="DES"
                disabled={data.user.rol_clave !== "SUPERADMIN_DES"}
                onCreated={load}
              />
              <DESUserList
                users={users}
                unidades={data.unidades}
                roles={data.roles}
                scope="DES"
                disabled={data.user.rol_clave !== "SUPERADMIN_DES"}
                onSaved={load}
              />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
