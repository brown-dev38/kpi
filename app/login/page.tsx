import { redirect } from "next/navigation";
import Image from "next/image";
import { BarChart3, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loginWithMicrosoft } from "@/app/login/actions";
import LoginForm from "@/app/login/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/kpi");

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#f8f6fa] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-[#3d2450] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-28 -top-28 size-96 rounded-full bg-[#8b4fa6]/35 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 size-80 rounded-full bg-emerald-700/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white p-2 shadow-xl shadow-black/10">
            <Image src="/logo/LogoMed2.png" alt="ตราคณะแพทยศาสตร์" width={52} height={52} className="size-full object-contain" priority />
          </div>
          <div>
            <p className="text-lg font-semibold">คณะแพทยศาสตร์</p>
            <p className="text-sm text-white/60">มหาวิทยาลัยพะเยา</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80 backdrop-blur">
            <Sparkles className="size-4 text-[#e3bc65]" />
            MED KPI Workspace
          </div>
          <h1 className="text-4xl font-semibold leading-[1.2] tracking-tight xl:text-5xl">
            ขับเคลื่อนองค์กรด้วยข้อมูล<br />ที่เห็นภาพและลงมือทำได้
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/65">
            บันทึก ติดตาม และสรุปผลตัวชี้วัดของคณะแพทยศาสตร์ไว้ในพื้นที่เดียว
          </p>
          <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
            {[{ icon: BarChart3, label: "เห็นภาพรวม" }, { icon: CheckCircle2, label: "ติดตามงาน" }, { icon: ShieldCheck, label: "ข้อมูลปลอดภัย" }].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <Icon className="mb-3 size-5 text-[#e3bc65]" />
                <p className="text-sm text-white/80">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/35">Faculty of Medicine · University of Phayao</p>
      </section>

      <section className="relative flex items-center justify-center p-5 sm:p-10">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <Card className="relative w-full max-w-[440px] gap-0 overflow-hidden border-white/70 bg-white/90 py-0 shadow-[0_24px_80px_rgba(68,38,81,0.12)] backdrop-blur-xl">
          <CardHeader className="px-7 pb-7 pt-8 text-left sm:px-9 sm:pt-9">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <Image src="/logo/LogoMed2.png" alt="ตราคณะแพทยศาสตร์" width={48} height={48} className="size-12 object-contain" priority />
              <div><p className="font-semibold">คณะแพทยศาสตร์</p><p className="text-xs text-muted-foreground">มหาวิทยาลัยพะเยา</p></div>
            </div>
            <p className="eyebrow mb-2">ยินดีต้อนรับ</p>
            <CardTitle className="text-2xl leading-tight sm:text-3xl">เข้าสู่ระบบรายงานตัวชี้วัด</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6">กรอกบัญชีของคุณเพื่อเข้าสู่พื้นที่ทำงาน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-7 pb-7 sm:px-9">
          <LoginForm />
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">หรือ</span>
            <Separator className="flex-1" />
          </div>
          <form action={loginWithMicrosoft}>
            <Button type="submit" variant="outline" size="lg" className="h-12 w-full bg-white">
              เข้าสู่ระบบด้วย Microsoft
            </Button>
          </form>
        </CardContent>
        <CardFooter className="border-t bg-muted/35 px-7 py-4 text-center text-xs text-muted-foreground sm:px-9">
          หากไม่สามารถเข้าสู่ระบบได้ กรุณาติดต่อผู้ดูแลระบบ
        </CardFooter>
      </Card>
      </section>
    </main>
  );
}
