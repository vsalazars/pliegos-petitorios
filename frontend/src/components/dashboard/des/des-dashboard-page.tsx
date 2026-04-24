"use client"

import { useEffect, useMemo, useState } from "react"

import { DESMetricCard } from "@/components/dashboard/des/des-metric-card"
import { DESUserCreateForm } from "@/components/dashboard/des/des-user-create-form"
import { DESUserList } from "@/components/dashboard/des/des-user-list"
import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell"
import { DashboardState } from "@/components/dashboard/shared/dashboard-state"
import type { AuthUser } from "@/lib/auth"
import { isUnidadRole, type DESRole, type DESUnidad, type DESUser } from "@/lib/des-admin"

type DESAdminResponse = {
  user: AuthUser
  unidades: DESUnidad[]
  roles: DESRole[]
  usuarios: DESUser[]
}

export function DESDashboardPage() {
  const [data, setData] = useState<DESAdminResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        const [meResponse, unidadesResponse, rolesResponse, usuariosResponse] =
          await Promise.all([
            fetch("/api/auth/me", { cache: "no-store" }),
            fetch("/api/admin/unidades", { cache: "no-store" }),
            fetch("/api/admin/roles", { cache: "no-store" }),
            fetch("/api/admin/usuarios", { cache: "no-store" }),
          ])

        const [mePayload, unidadesPayload, rolesPayload, usuariosPayload] =
          await Promise.all([
            meResponse.json(),
            unidadesResponse.json(),
            rolesResponse.json(),
            usuariosResponse.json(),
          ])

        if (!isActive) {
          return
        }

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

        setError(null)
        setData({
          user: mePayload.user as AuthUser,
          unidades: (unidadesPayload.items ?? []) as DESUnidad[],
          roles: (rolesPayload.items ?? []) as DESRole[],
          usuarios: (usuariosPayload.items ?? []) as DESUser[],
        })
      } catch {
        if (isActive) {
          setError("No fue posible conectar con la administración DES.")
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

  const metrics = useMemo(() => {
    const unidades = data?.unidades ?? []
    const users = data?.usuarios ?? []
    const unidadUsers = users.filter((item) => isUnidadRole(item.rol_clave))

    return {
      totalUnidades: unidades.filter((item) => item.activo).length,
      cuentasUnidad: unidadUsers.length,
      cuentasActivas: unidadUsers.filter((item) => item.activo).length,
      pendientesCambioPassword: unidadUsers.filter((item) => item.debe_cambiar_password).length,
    }
  }, [data])

  if (isLoading) {
    return (
      <DashboardShell
        badge="DES"
        title="Administración DES"
        subtitle="Estamos cargando unidades, perfiles y cuentas disponibles."
      >
        <DashboardState
          title="Cargando administración DES"
          description="Estamos preparando el panel de altas para unidades académicas."
        />
      </DashboardShell>
    )
  }

  if (error || !data) {
    return (
      <DashboardShell
        badge="DES"
        title="Administración DES"
        subtitle="Este espacio concentra la creación y supervisión de cuentas por unidad."
      >
        <DashboardState
          title="No pudimos abrir la administración DES"
          description={error ?? "Intenta recargar la sesión."}
        />
      </DashboardShell>
    )
  }

  const unidadUsers = data.usuarios
    .filter((item) => isUnidadRole(item.rol_clave))
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )

  return (
    <DashboardShell
      badge="DES"
      title="Administración DES"
      subtitle="Alta rápida de cuentas para unidades académicas y revisión del acceso ya asignado."
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DESMetricCard label="Unidades activas" value={metrics.totalUnidades} tone="solid" />
          <DESMetricCard label="Cuentas de unidad" value={metrics.cuentasUnidad} tone="slate" />
          <DESMetricCard label="Cuentas activas" value={metrics.cuentasActivas} tone="green" />
          <DESMetricCard
            label="Cambio de password pendiente"
            value={metrics.pendientesCambioPassword}
            tone="rose"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DESUserCreateForm
            unidades={data.unidades}
            roles={data.roles}
            disabled={data.user.rol_clave !== "SUPERADMIN_DES"}
            onCreated={load}
          />
          <DESUserList users={unidadUsers.slice(0, 8)} />
        </section>
      </div>
    </DashboardShell>
  )
}
