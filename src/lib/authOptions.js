import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { user, role, department, division } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const foundUser = await db.query.user.findFirst({
          where: eq(user.email, credentials.email),
          with: {
            role: true,
            department: true,
            division: true
          }
        });

        if (!foundUser) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          foundUser.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        if (!foundUser.isActive) {
          throw new Error("This account is inactive");
        }

        return {
          id: foundUser.id.toString(),
          name: foundUser.name,
          email: foundUser.email,
          roleName: foundUser.role?.name,
          permissions: foundUser.role?.permissions,
          departmentCode: foundUser.department?.code,
          departmentName: foundUser.department?.name,
          divisionName: foundUser.division?.name,
          positionName: foundUser.positionName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 Hari (24 Jam)
    updateAge: 60 * 60,    // Refresh token per 1 jam saat ada aktivitas aktif
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 1 Hari (24 Jam)
  },
  callbacks: {
    async jwt({ token, user: authUser, trigger, session }) {
      if (authUser) {
        token.id = authUser.id;
        token.name = authUser.name;
        token.email = authUser.email;
        token.roleName = authUser.roleName;
        token.permissions = authUser.permissions;
        token.departmentCode = authUser.departmentCode;
        token.departmentName = authUser.departmentName;
        token.divisionName = authUser.divisionName;
        token.positionName = authUser.positionName;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email; // explicitly preserve email
        session.user.roleName = token.roleName;
        session.user.permissions = token.permissions;
        session.user.departmentCode = token.departmentCode;
        session.user.departmentName = token.departmentName;
        session.user.divisionName = token.divisionName;
        session.user.positionName = token.positionName;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch (e) {}
      return baseUrl + "/dashboard";
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev_only",
};
