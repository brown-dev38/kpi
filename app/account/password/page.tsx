import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PasswordForm from "@/app/account/password/password-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const isInitialSetup =
    session.user.authProvider === "microsoft-entra-id" &&
    !session.user.hasPassword;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isInitialSetup ? "กำหนดรหัสผ่าน" : "เปลี่ยนรหัสผ่าน"}
          </CardTitle>
          <CardDescription>
            {isInitialSetup
              ? "กำหนดรหัสผ่านเพื่อให้สามารถเข้าสู่ระบบด้วยอีเมลได้"
              : "เพื่อความปลอดภัย กรุณายืนยันรหัสผ่านปัจจุบันก่อนเปลี่ยนรหัสผ่าน"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm isInitialSetup={isInitialSetup} />
        </CardContent>
      </Card>
    </main>
  );
}
