import {compare} from "bcryptjs";
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
        password: {label: "Password", type: "password"}
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {email: credentials.email.toLowerCase()},
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true
          }
        });

        if (!user) {
          return null;
        }

        const passwordMatches = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
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
