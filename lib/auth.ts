import {randomBytes} from "crypto";
import {compare, hash} from "bcryptjs";
import type {Role} from "@prisma/client";
import type {NextAuthOptions, Session, User} from "next-auth";
import type {JWT} from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

import {prisma} from "@/lib/prisma";

type AuthorizedUser = User & {
  id: string;
  role: Role;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"},
        name: {label: "Name", type: "text"}
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        const name = credentials?.name?.trim();

        if (!email) {
          return null;
        }

        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();

        const existingUser = await prisma.user.findUnique({
          where: {email},
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true
          }
        });

        const isSystemAdmin = adminEmail && email === adminEmail;
        const isDbAdmin = existingUser?.role === "ADMIN";

        if (isSystemAdmin || isDbAdmin) {
          if (!existingUser) {
            return null; // Admin user must be seeded in database
          }
          const passwordMatches = await compare(password, existingUser.passwordHash);
          if (!passwordMatches) {
            return null;
          }
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role
          };
        }

        const user = await prisma.user.upsert({
          where: {email},
          update: {
            ...(name ? {name} : {})
          },
          create: {
            email,
            passwordHash: await hash(randomBytes(32).toString("hex"), 12),
            name: name || null
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        });

        return user;
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 180,
    updateAge: 60 * 60 * 24
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 180
  },
  callbacks: {
    async jwt({token, user}: {token: JWT; user?: AuthorizedUser}) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({session, token}: {session: Session; token: JWT}) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    }
  }
};
