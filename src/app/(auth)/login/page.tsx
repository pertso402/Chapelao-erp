import { BrandMark } from "@/components/BrandMark";
import { LoginForm } from "@/components/LoginForm";
import { listarColaboradoresLogin } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const colaboradores = await listarColaboradoresLogin();

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="chap-stripe" />
        <div className="flex flex-col gap-6 p-8">
          <div className="flex justify-center">
            <BrandMark />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-marino">Acesso ao ERP</h1>
            <p className="mt-1 text-sm text-muted">Toque no seu nome pra entrar</p>
          </div>

          <LoginForm colaboradores={colaboradores} />
        </div>
      </div>
    </main>
  );
}
