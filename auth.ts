import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { DefaultSession } from "next-auth";
import { credentialsSchema } from "@/lib/auth/schema";
import {
  authenticateCredentials,
  refreshSessionUser,
  resolveMicrosoftUser,
  type SessionUserData,
} from "@/lib/auth/user";

declare module "next-auth" {
  interface User {
    department_id?: string;
    department?: string;
    role?: string;
    authProvider?: SessionUserData["authProvider"];
    mustChangePassword?: boolean;
    hasPassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      department_id: string;
      department: string;
      role: string;
      email: string;
      emailVerified: Date | null;
      authProvider: SessionUserData["authProvider"];
      mustChangePassword: boolean;
      hasPassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    authProvider?: SessionUserData["authProvider"];
    user?: SessionUserData;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      name: "microsoft-entra-id",
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
    Credentials({
      name: "อีเมลและรหัสผ่าน",
      credentials: {
        email: { label: "อีเมล", type: "email" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        return authenticateCredentials(
          parsed.data.email,
          parsed.data.password,
        );
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt: async ({ token, account, user }) => {
      let sessionUser: SessionUserData | null = null;

      if (account?.provider === "microsoft-entra-id") {
        if (!user.email) throw new Error("Microsoft account does not have email");
        sessionUser = await resolveMicrosoftUser({
          email: user.email,
          providerAccountId: account.providerAccountId,
        });
      } else if (account?.provider === "credentials" && user.id) {
        sessionUser = user as SessionUserData;
      } else if (token.userId && token.authProvider) {
        sessionUser = await refreshSessionUser(
          token.userId,
          token.authProvider,
        );
      }

      // provider ของ Entra ดึงรูปโปรไฟล์มาเป็น base64 data URL ใส่ token.picture
      // ถ้าปล่อยไว้ session cookie จะโตจนถูกหั่นหลายชิ้น และ reverse proxy ตอบ 502
      delete token.picture;

      if (sessionUser) {
        token.userId = sessionUser.id;
        token.authProvider = sessionUser.authProvider;
        token.user = sessionUser;
      } else {
        delete token.user;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token.user) {
        session.user = token.user;
      }
      return session;
    },
  },
});
