import prisma from "@/lib/prisma/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const dummyPasswordHash = hashPassword("invalid-credential-placeholder");

const bangkokNow = () => new Date(Date.now() + 7 * 60 * 60 * 1000);

const userSelect = {
  id: true,
  email: true,
  passwordHash: true,
  first_name: true,
  last_name: true,
  isActive: true,
  mustChangePassword: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  department: { select: { id: true, name: true } },
  role: { select: { name: true } },
} as const;

export type SessionUserData = {
  id: string;
  name: string;
  department_id: string;
  department: string;
  role: string;
  email: string;
  emailVerified: Date | null;
  authProvider: "credentials" | "microsoft-entra-id";
  mustChangePassword: boolean;
  hasPassword: boolean;
};

const toSessionUser = (
  user: {
    id: number;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    passwordHash: string | null;
    mustChangePassword: boolean;
    department: { id: number; name: string } | null;
    role: { name: string } | null;
  },
  provider: SessionUserData["authProvider"],
): SessionUserData => ({
  id: user.id.toString(),
  name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
  department_id: user.department?.id.toString() ?? "",
  department: user.department?.name ?? "",
  role: user.role?.name ?? "user",
  email: user.email ?? "",
  emailVerified: null,
  authProvider: provider,
  mustChangePassword: user.mustChangePassword,
  hasPassword: Boolean(user.passwordHash),
});

export const authenticateCredentials = async (email: string, password: string) => {
  const user = await prisma.users.findUnique({
    where: { email },
    select: userSelect,
  });

  const now = bangkokNow();
  const hashToCheck = user?.passwordHash ?? (await dummyPasswordHash);
  const passwordMatches = await verifyPassword(password, hashToCheck);
  const lockIsActive =
    user?.lockedUntil !== null &&
    user?.lockedUntil !== undefined &&
    user.lockedUntil > now;

  if (
    !user ||
    !user.isActive ||
    !user.passwordHash ||
    lockIsActive ||
    !passwordMatches
  ) {
    if (user && user.isActive && !lockIsActive) {
      const failedLoginAttempts = user.lockedUntil
        ? 1
        : user.failedLoginAttempts + 1;
      await prisma.users.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts,
          lockedUntil:
            failedLoginAttempts >= MAX_FAILED_ATTEMPTS
              ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
              : null,
          updateat: now,
        },
      });
    }
    return null;
  }

  await prisma.users.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: now,
      updateat: now,
    },
  });

  return toSessionUser(user, "credentials");
};

export const resolveMicrosoftUser = async ({
  email,
  providerAccountId,
}: {
  email: string;
  providerAccountId: string;
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const username = normalizedEmail.split("@")[0];

  const [byRefId, byEmail] = await Promise.all([
    prisma.users.findUnique({ where: { refId: providerAccountId } }),
    prisma.users.findUnique({ where: { email: normalizedEmail } }),
  ]);

  if (byRefId && byEmail && byRefId.id !== byEmail.id) {
    throw new Error("บัญชี Microsoft และอีเมลถูกผูกกับผู้ใช้คนละรายการ");
  }

  const legacyMatches =
    byRefId || byEmail
      ? []
      : await prisma.users.findMany({ where: { username }, take: 2 });
  if (legacyMatches.length > 1) {
    throw new Error("พบ username เดิมซ้ำกัน ไม่สามารถเชื่อมบัญชีอัตโนมัติได้");
  }
  const legacyUser = legacyMatches[0] ?? null;
  const existingUser = byRefId ?? byEmail ?? legacyUser;
  const now = bangkokNow();

  const user = existingUser
    ? await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          refId: providerAccountId,
          email: normalizedEmail,
          emailVerifiedAt: existingUser.emailVerifiedAt ?? now,
          lastLoginAt: now,
          updateat: now,
        },
        select: userSelect,
      })
    : await prisma.users.create({
        data: {
          refId: providerAccountId,
          username,
          email: normalizedEmail,
          emailVerifiedAt: now,
          lastLoginAt: now,
          roleid: 3,
          isActive: true,
          createat: now,
          updateat: now,
        },
        select: userSelect,
      });

  if (!user.isActive) return null;
  return toSessionUser(user, "microsoft-entra-id");
};

export const refreshSessionUser = async (
  userId: string,
  provider: SessionUserData["authProvider"],
) => {
  const user = await prisma.users.findUnique({
    where: { id: Number(userId) },
    select: userSelect,
  });

  return user?.isActive ? toSessionUser(user, provider) : null;
};

export const changeUserPassword = async ({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: number;
  currentPassword: string;
  newPassword: string;
}) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { passwordHash: true, isActive: true },
  });

  if (
    !user?.isActive ||
    !user.passwordHash ||
    !(await verifyPassword(currentPassword, user.passwordHash))
  ) {
    return false;
  }

  const now = bangkokNow();
  await prisma.users.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(newPassword),
      passwordChangedAt: now,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updateat: now,
    },
  });

  return true;
};

export const setInitialPasswordFromMicrosoft = async ({
  userId,
  newPassword,
}: {
  userId: number;
  newPassword: string;
}) => {
  const now = bangkokNow();
  const result = await prisma.users.updateMany({
    where: {
      id: userId,
      isActive: true,
      passwordHash: null,
    },
    data: {
      passwordHash: await hashPassword(newPassword),
      passwordChangedAt: now,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updateat: now,
    },
  });

  return result.count === 1;
};
