"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  ClipboardPlus,
  Home,
  LogIn,
  LogOut,
  Settings,
  User,
  UserPen,
  Warehouse,
  ClipboardCheck,
  FolderSymlink,
  Wrench,
  Database,
  Users,
  Timer,
  Book,
  Clock,
  Calendar,
  FileDown,
  Star,
  KeyRound,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  logOut,
  fetchProfile,
  updateProfile,
  countUnansweredIndicators,
  fetchActiveAcademicYears,
  fetchResearchMainsWithCount,
  fetchAdminMainsWithCount,
} from "@/app/kpi/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useEffect, useState, useTransition } from "react";
import { DialogClose } from "@radix-ui/react-dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

type ProfileForm = {
  id: number;
  username: string;
  cid: string;
  first_name: string;
  last_name: string;
  department: number;
  position: number;
};

type Department = {
  id: number;
  name: string | null;
};

type Position = {
  id: number;
  name: string | null;
};

type AcademicYear = {
  id: number;
  year: number;
  semester: number;
};

type ResearchMain = {
  id: number;
  name: string;
  unansweredCount: number;
};

type AdminMain = {
  id: number;
  name: string;
  unansweredCount: number;
};

type Menu = {
  title: string;
  icon: React.ReactNode;
  url: string;
  items?: {
    title: string;
    url: string;
  }[];
};

const userMenu: Menu[] = [
  {
    title: "ลงข้อมูล",
    url: "#",
    icon: <Star />,
    items: [
      {
        title: "ตัวชี้วัด",
        url: "/kpi/register/indicator",
      },
    ],
  },
];

const adminMenu: Menu[] = [
  {
    title: "ข้อมูลพื้นฐาน",
    icon: <Settings />,
    url: "#",
    items: [
      {
        title: "แผนก",
        url: "/kpi/settings/department",
      },
      {
        title: "ตำแหน่ง",
        url: "/kpi/settings/position",
      },
      {
        title: "สิทธิ์การใช้งาน",
        url: "/kpi/settings/role",
      },
      {
        title: "ปีการศึกษา",
        url: "/kpi/settings/academic_year",
      },
      {
        title: "ปีงบประมาณ",
        url: "/kpi/settings/fiscal_year",
      },
      {
        title: "หลักสูตร",
        url: "/kpi/settings/program",
      },
    ],
  },
  {
    title: "ผู้ใช้งาน",
    icon: <Users />,
    url: "#",
    items: [
      {
        title: "พนักงาน",
        url: "/kpi/settings/users",
      },
      {
        title: "เจ้าหน้าที่",
        url: "/kpi/settings/staff",
      },
    ],
  },
  {
    title: "KPI (ด้านงานวิชาการ + ด้านงานพัฒนาคุณภาพนิสิต)",
    icon: <Star />,
    url: "#",
    items: [
      {
        title: "หัวข้อหลัก",
        url: "/kpi/settings/kpi/main",
      },
      {
        title: "หัวข้อย่อย",
        url: "/kpi/settings/kpi/sub",
      },
      {
        title: "ตัวชี้วัด",
        url: "/kpi/settings/kpi/indicator",
      },
    ],
  },
  {
    title: "KPI (ด้านงานบริหารทั่วไป)",
    icon: <Star />,
    url: "#",
    items: [
      {
        title: "หัวข้อหลัก",
        url: "/kpi/settings/kpi/admin/main",
      },
      {
        title: "ตัวชี้วัด",
        url: "/kpi/settings/kpi/admin/indicator",
      },
    ],
  },
  {
    title: "KPI (ด้านงานวิจัยและบริการวิชาการ)",
    icon: <Star />,
    url: "#",
    items: [
      {
        title: "หัวข้อหลัก",
        url: "/kpi/settings/kpi/research/main",
      },
      {
        title: "ตัวชี้วัด",
        url: "/kpi/settings/kpi/research/indicator",
      },
    ],
  },
];

export default function AppsideBar() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const [department, setDepartment] = useState<Department[]>([]);
  const [position, setPosition] = useState<Position[]>([]);
  const [selectDep, setSelectDep] = useState<boolean>(false);
  const [selectPos, setSelectPos] = useState<boolean>(false);
  const [isProfile, setIsProfile] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [pending, startTransition] = useTransition();
  const [isMedStaff, setIsMedStaff] = useState<boolean>(false);
  const [unansweredCounts, setUnansweredCounts] = useState<
    Record<number, number>
  >({});
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [researchMains, setResearchMains] = useState<ResearchMain[]>([]);
  const [adminMains, setAdminMains] = useState<AdminMain[]>([]);

  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      fetchActiveAcademicYears().then(async (years) => {
        setAcademicYears(years);
        const uniqueYears = [...new Set(years.map((y) => y.year))];
        const results = await Promise.all(
          uniqueYears.map((year) =>
            countUnansweredIndicators(year).then((count) => ({ year, count })),
          ),
        );
        const countsMap: Record<number, number> = {};
        results.forEach(({ year, count }) => {
          countsMap[year] = count;
        });
        setUnansweredCounts(countsMap);
      });
      fetchResearchMainsWithCount().then(setResearchMains);
      fetchAdminMainsWithCount().then(setAdminMains);
    }
  }, [session?.user?.id]);

  const form = useForm<ProfileForm>({
    defaultValues: {
      id: 0,
      username: "",
      first_name: "",
      last_name: "",
      cid: "",
      department: 0,
      position: 0,
    },
  });

  const handleUpdateProfile = async (v: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    cid: string;
    department: number;
    position: number;
  }) => {
    startTransition(async () => {
      const res = await updateProfile(v);
      if (res?.errors) {
        return Object.entries(res.errors).forEach(([fieldName, messages]) => {
          form.setError(fieldName as keyof typeof v, {
            message: messages?.[0],
          });
        });
      }

      if (res.status === true) {
        toast.success(res.messages);
        setIsProfile(false);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(res.messages);
      }
    });
  };

  const totalUnanswered = Object.values(unansweredCounts).reduce(
    (a, b) => a + b,
    0,
  );

  const totalResearchUnanswered = researchMains.reduce(
    (a, b) => a + b.unansweredCount,
    0,
  );

  const totalAdminUnanswered = adminMains.reduce(
    (a, b) => a + b.unansweredCount,
    0,
  );

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="h-14 hover:bg-sidebar-accent/70">
              <Link href="/kpi">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
                  <Image src="/logo/LogoMed2.png" alt="ตราคณะแพทยศาสตร์" width={36} height={36} className="size-full object-contain" />
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-white">
                    ระบบรายงานตัวชี้วัด
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/55">คณะแพทยศาสตร์ ม.พะเยา</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-2 py-4">
          <SidebarGroupLabel className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">เมนูหลัก</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/kpi"} className="h-10">
                  <Link href="/kpi" aria-current={pathname === "/kpi" ? "page" : undefined}>
                    <Home />
                    หน้าหลัก
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* {session?.user?.id &&
                session?.user?.name &&
                session?.user?.role &&
                session?.user?.department &&
                userMenu.map((x) => (
                  <React.Fragment key={x.title}>
                    {x.items ? (
                      <Collapsible
                        className="group/collapsible"
                        key={x.title}
                        asChild
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              tooltip={x.title}
                              className="h-auto"
                            >
                              <Link href="">
                                <div className="whitespace-normal wrap-break-word min-w-0">
                                  {x.title}
                                </div>
                                {totalUnanswered > 0 && (
                                  <Badge variant="destructive" className="shrink-0">{totalUnanswered}</Badge>
                                )}
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </Link>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {x.items &&
                                x.items.map((y) => (
                                  <SidebarMenuSubItem key={y.title}>
                                    <SidebarMenuSubButton asChild className="h-auto min-h-7 py-1.5">
                                      <Link href={y.url}>
                                        <div className="flex w-full min-w-0 items-center justify-between gap-2">
                                          <span className="min-w-0 whitespace-normal wrap-break-word leading-snug">{y.title}</span>
                                          {totalUnanswered > 0 && (
                                            <Badge variant="destructive" className="shrink-0">{totalUnanswered}</Badge>
                                          )}
                                        </div>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      <SidebarMenuItem key={x.title}>
                        <SidebarMenuButton asChild className="h-auto">
                          <Link href={x.url}>
                            {x.icon}{" "}
                            <div className="whitespace-normal wrap-break-word min-w-0">
                              {x.title}
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </React.Fragment>
                ))} */}
              {session?.user?.id &&
                session?.user?.name &&
                session?.user?.role &&
                session?.user?.department &&
                academicYears.length > 0 && (
                  <Collapsible className="group/collapsible" asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="min-h-11 h-auto py-2.5" isActive={pathname.startsWith("/kpi/register/indicator")}>
                          <Star className="shrink-0" />
                          <span className="whitespace-normal wrap-break-word min-w-0">
                            KPI (ด้านงานวิชาการ + ด้านงานพัฒนาคุณภาพนิสิต)
                          </span>
                          {totalUnanswered > 0 && (
                            <Badge variant="destructive" className="shrink-0">
                              {totalUnanswered}
                            </Badge>
                          )}
                          <ChevronRight className="ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {[
                            ...new Map(
                              academicYears.map((ay) => [ay.year, ay]),
                            ).values(),
                          ].map((ay) => (
                            <SidebarMenuSubItem key={ay.year}>
                              <SidebarMenuSubButton asChild className="h-auto min-h-7 py-1.5">
                                <Link
                                  href={`/kpi/register/indicator?year=${ay.year}`}
                                >
                                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                                    <span className="min-w-0 whitespace-normal wrap-break-word leading-snug">ปีการศึกษา {ay.year}</span>
                                    {(unansweredCounts[ay.year] ?? 0) > 0 && (
                                      <Badge variant="destructive" className="shrink-0">
                                        {unansweredCounts[ay.year]}
                                      </Badge>
                                    )}
                                  </div>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
              {session?.user?.id &&
                session?.user?.name &&
                session?.user?.role &&
                session?.user?.department &&
                researchMains.length > 0 && (
                  <Collapsible className="group/collapsible" asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="min-h-11 h-auto py-2.5" isActive={pathname.startsWith("/kpi/register/research")}>
                          <Star className="shrink-0" />
                          <span className="whitespace-normal wrap-break-word min-w-0">
                            KPI (ด้านงานวิจัยและบริการวิชาการ)
                          </span>
                          {totalResearchUnanswered > 0 && (
                            <Badge variant="destructive" className="shrink-0">
                              {totalResearchUnanswered}
                            </Badge>
                          )}
                          <ChevronRight className="ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {researchMains.map((rm) => (
                            <SidebarMenuSubItem key={rm.id}>
                              <SidebarMenuSubButton asChild className="h-auto min-h-7 py-1.5">
                                <Link href={`/kpi/register/research?main=${rm.id}`}>
                                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                                    <span className="min-w-0 whitespace-normal wrap-break-word leading-snug">{rm.name}</span>
                                    {rm.unansweredCount > 0 && (
                                      <Badge variant="destructive" className="shrink-0">
                                        {rm.unansweredCount}
                                      </Badge>
                                    )}
                                  </div>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
              {session?.user?.id &&
                session?.user?.name &&
                session?.user?.role &&
                session?.user?.department &&
                adminMains.length > 0 && (
                  <Collapsible className="group/collapsible" asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="min-h-11 h-auto py-2.5" isActive={pathname.startsWith("/kpi/register/admin")}>
                          <Star className="shrink-0" />
                          <span className="whitespace-normal wrap-break-word min-w-0">
                            KPI (ด้านงานบริหารทั่วไป)
                          </span>
                          {totalAdminUnanswered > 0 && (
                            <Badge variant="destructive" className="shrink-0">
                              {totalAdminUnanswered}
                            </Badge>
                          )}
                          <ChevronRight className="ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {adminMains.map((am) => (
                            <SidebarMenuSubItem key={am.id}>
                              <SidebarMenuSubButton asChild className="h-auto min-h-7 py-1.5">
                                <Link href={`/kpi/register/admin?main=${am.id}`}>
                                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                                    <span className="min-w-0 whitespace-normal wrap-break-word leading-snug">{am.name}</span>
                                    {am.unansweredCount > 0 && (
                                      <Badge variant="destructive" className="shrink-0">
                                        {am.unansweredCount}
                                      </Badge>
                                    )}
                                  </div>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* {session?.user.isDepHead && (
          <SidebarGroup>
            <SidebarGroupLabel>งานเทคโนโลยีสารสนเทศ</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {itMenu.map((x) => {
                  if (x?.items) {
                    return (
                      <Collapsible
                        className="group/collapsible"
                        key={x.title}
                        asChild
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton asChild tooltip={x.title}>
                              <Link href="">
                                {x.icon}
                                <span>{x.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </Link>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {x.items.map((y) => (
                                <SidebarMenuSubItem key={y.name}>
                                  <SidebarMenuSubButton asChild className="h-auto min-h-7 py-1.5">
                                    <Link href={y.url}>
                                      <span>{y.name}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  } else {
                    return (
                      <SidebarMenuItem key={x.title}>
                        <SidebarMenuButton asChild>
                          <Link href={x.url}>
                            {x.icon}
                            <span>{x.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )} */}

        {session?.user?.role === "administrator" && (
          <SidebarGroup className="px-2 py-4">
            <SidebarGroupLabel className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">ผู้ดูแลระบบ</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenu.map((x) => (
                  <SidebarMenuItem key={x.title}>
                    <Collapsible className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="min-h-11 h-auto py-2.5" isActive={x.items?.some((item) => pathname.startsWith(item.url))}>
                          {x.icon}
                          <span className="whitespace-normal wrap-break-word">
                            {x.title}
                          </span>
                          <ChevronRight className="ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {x.items?.map((y) => (
                            <SidebarMenuItem key={y.title}>
                              <SidebarMenuButton asChild isActive={pathname === y.url}>
                                <Link href={y.url} aria-current={pathname === y.url ? "page" : undefined}>
                                  <span>{y.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2.5">
        <SidebarMenu>
          <SidebarMenuItem>
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size={"lg"}
                    className="h-12 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-9 w-9 rounded-xl border border-white/10">
                      <AvatarImage src={""} alt={"profile"} />
                      <AvatarFallback className="rounded-xl bg-[#d5a94f] font-semibold text-[#3d2450]">
                        {session.user.name?.slice(0, 1) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {session.user.name}
                      </span>
                      <span className="truncate text-xs">
                        {session.user.department}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "bottom"}
                  align="end"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onSelect={async () => {
                        setIsProfile(true);
                        setIsLoadingProfile(true);
                        const res = await fetchProfile();
                        form.reset({
                          id: res?.user?.id,
                          username: res?.user?.username ?? "",
                          first_name: res?.user?.first_name ?? "",
                          last_name: res?.user?.last_name ?? "",
                          cid: res?.user?.cid ?? "",
                          department: res?.user?.depid ?? 0,
                          position: res?.user?.posid ?? 0,
                        });
                        setDepartment(res.departments);
                        setPosition(res.positions);
                        setIsLoadingProfile(false);
                      }}
                    >
                      <UserPen />
                      ข้อมูลส่วนตัว
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/password">
                        <KeyRound />
                        {session.user.hasPassword
                          ? "เปลี่ยนรหัสผ่าน"
                          : "กำหนดรหัสผ่าน"}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => logOut()}
                  >
                    <LogOut />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton asChild>
                <Button asChild>
                  <Link href="/login">
                  <LogIn />
                  เข้าสู่ระบบ
                  </Link>
                </Button>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={isProfile} onOpenChange={setIsProfile}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <form id="profile" onSubmit={form.handleSubmit(handleUpdateProfile)}>
            <DialogHeader className="mb-3">
              <DialogTitle>ข้อมูลส่วนตัว;</DialogTitle>
              <DialogDescription>
                กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน
              </DialogDescription>
            </DialogHeader>
            <div className="w-full mb-5">
              {isLoadingProfile ? (
                <>
                  <div className="space-y-2 mb-5">
                    <Skeleton className="h-4 w-25" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 mb-5">
                      <Skeleton className="h-4 w-25" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="space-y-2  mb-5">
                      <Skeleton className="h-4 w-25" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-5s">
                    <Skeleton className="h-4 w-25" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </>
              ) : (
                <FieldGroup>
                  <Controller
                    name="username"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>ชื่อผู้ใช้งาน</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder="กรุณากรอกชื่อผู้ใช้งาน"
                          readOnly
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="first_name"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>ชื่อ</FieldLabel>
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid}
                            placeholder="กรุณากรอกชื่อ"
                          />
                          {fieldState.error && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="last_name"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>นามสกุล</FieldLabel>
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid}
                            placeholder="กรุณากรอกนามสกุล"
                          />
                          {fieldState.error && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <div className="space-y-2 mb-5">
                    <Controller
                      name="cid"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>รหัสประจำตัวประชาชน</FieldLabel>
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid}
                            placeholder="กรุณากรอกรหัสประจำตัวประชาชน"
                          />
                          {fieldState.error && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="department"
                      control={form.control}
                      render={({ field, fieldState }) => {
                        const current = field.value ?? "";
                        return (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>หน่วยงาน</FieldLabel>
                            <Popover
                              open={selectDep}
                              onOpenChange={setSelectDep}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  role="combobox"
                                  aria-expanded={selectDep}
                                  className="w-full justify-between"
                                >
                                  {form.getValues("department")
                                    ? department?.find(
                                        (x) =>
                                          x.id === form.getValues("department"),
                                      )?.name
                                    : "กรุณาเลือกหน่วยงาน"}
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <Command>
                                  <CommandInput
                                    placeholder="กรุณาเลือกหน่วยงาน"
                                    className="h-9"
                                  />
                                  <CommandList
                                    onWheelCapture={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <CommandEmpty>
                                      ไม่มีหน่วยงานที่ระบุ
                                    </CommandEmpty>
                                    <CommandGroup heading="หน่วยงาน">
                                      {department?.map((x) => (
                                        <CommandItem
                                          key={x.id}
                                          value={x.name ?? ""}
                                          onSelect={() => {
                                            field.onChange(
                                              x.id === current ? current : x.id,
                                            );
                                            setSelectDep(false);
                                          }}
                                        >
                                          {x.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {fieldState.error && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        );
                      }}
                    />
                    <Controller
                      name="position"
                      control={form.control}
                      render={({ field, fieldState }) => {
                        const current = field.value ?? "";
                        return (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>หน่วยงาน</FieldLabel>
                            <Popover
                              open={selectPos}
                              onOpenChange={setSelectPos}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  role="combobox"
                                  aria-expanded={selectPos}
                                  className="w-full justify-between"
                                >
                                  {form.getValues("position")
                                    ? position?.find(
                                        (x) =>
                                          x.id === form.getValues("position"),
                                      )?.name
                                    : "กรุณาเลือกตำแหน่ง"}
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <Command>
                                  <CommandInput
                                    placeholder="กรุณาเลือกตำแหน่ง"
                                    className="h-9"
                                  />
                                  <CommandList
                                    onWheelCapture={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <CommandEmpty>
                                      ไม่มีตำแหน่งที่ระบุ
                                    </CommandEmpty>
                                    <CommandGroup heading="ตำแหน่ง">
                                      {position?.map((x) => (
                                        <CommandItem
                                          key={x.id}
                                          value={x.name ?? ""}
                                          onSelect={() => {
                                            field.onChange(
                                              x.id === current ? current : x.id,
                                            );
                                            setSelectPos(false);
                                          }}
                                        >
                                          {x.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {fieldState.error && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        );
                      }}
                    />
                  </div>
                </FieldGroup>
              )}
            </div>
            {!isLoadingProfile && (
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant={"outline"}>ปิด</Button>
                </DialogClose>
                <Button type="submit" form="profile" disabled={pending}>
                  {pending ? <Spinner /> : "บันทึก"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
