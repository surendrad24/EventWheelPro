import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { MatrixRainBackground } from "@/components/matrix-rain-background";
import { getAdminFromServerCookies } from "@/lib/server/admin-auth";

export default async function AdminLoginPage() {
  const admin = await getAdminFromServerCookies();
  if (admin) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="admin-login-page">
      <MatrixRainBackground className="admin-login-rain" />
      <div className="admin-login-wrap">
        <div className="admin-login-logo">FUSION MATRIX</div>
        <section className="card card-pad stack admin-login-card">
          <div className="eyebrow">Admin Auth</div>
          <h1 className="title-lg">Admin Console Sign In</h1>
          <p className="muted">Use your credentials to access the operator dashboard.</p>
          <AdminLoginForm />
        </section>
      </div>
    </main>
  );
}
