"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const checkSession = async () => {
  const session = await auth();

  if (!session?.user || !session?.user.id) {
    return redirect("/login");
  }

  // A redirect thrown inside a Server Action is encoded as a valid action
  // response. The proxy deliberately lets Server Actions reach this guard.
  if (session.user.mustChangePassword) {
    return redirect("/account/password");
  }

  return session?.user;
};

/**
 * Admin-only pages/data (the "ผู้ดูแลระบบ" sidebar menu: /kpi/settings/*).
 * The role is re-read from the database on every request, so it can be
 * revoked mid-session (e.g. an admin changes their own role): send the user
 * home instead of throwing an error.
 */
export const checkAdministrator = async () => {
  const user = await checkSession();

  if (user.role !== "administrator") {
    return redirect("/kpi");
  }

  return user;
};
