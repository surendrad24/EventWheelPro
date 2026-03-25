import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminFromServerCookies } from "@/lib/server/admin-auth";

export default async function AdminLoginPage() {
  const admin = await getAdminFromServerCookies();
  if (admin) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="page shell" style={{ maxWidth: 520 }}>
      <section className="card card-pad stack">
        <div className="eyebrow">Admin Auth</div>
        <h1 className="title-lg">Operator sign in</h1>
        <p className="muted">Use your operator credentials to access protected admin routes and APIs.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
