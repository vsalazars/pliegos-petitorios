import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveFullName, type DESUser } from "@/lib/des-admin"

type DESUserListProps = {
  users: DESUser[]
}

export function DESUserList({ users }: DESUserListProps) {
  return (
    <Card className="rounded-[1.8rem] border-[#ddd8de] py-0">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-2xl text-[#5f1024]">Cuentas de unidades</CardTitle>
        <CardDescription>
          Usuarios de unidad ya registrados, con unidad, perfil y estado de acceso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6">
        {users.length === 0 ? (
          <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
            Todavía no hay cuentas de unidad registradas.
          </div>
        ) : (
          users.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.35rem] border border-[#ece8ec] bg-white px-4 py-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#404149]">{resolveFullName(item)}</p>
                  <p className="mt-1 text-sm text-[#73737b]">{item.correo}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    item.activo
                      ? "bg-[#edf6f1] text-[#2f6b4f]"
                      : "bg-[#f2f4f7] text-[#55606d]"
                  }`}
                >
                  {item.activo ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#66666d]">
                <span>Usuario {item.username}</span>
                <span>{item.rol_nombre}</span>
                <span>{item.unidad_clave ? `${item.unidad_clave} · ${item.unidad_nombre}` : "Sin unidad"}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
