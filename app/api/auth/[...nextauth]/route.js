import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/analytics.readonly",
          prompt: "select_account consent",
          access_type: "offline",
          response_type: "code",
          hd: "redtecnologica.org",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user?.email?.toLowerCase();
      if (!email || !email.endsWith("@redtecnologica.org")) {
        return false;
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires =
          Date.now() + (account.expires_in ?? 3600) * 1000;
      }

      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires
      ) {
        return token;
      }

      // Sesiones previas sin expiración en el JWT: no forzar refresh sin criterio claro
      if (typeof token.accessTokenExpires !== "number") {
        return token;
      }

      if (!token.refreshToken) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken,
          }),
        });

        const refreshed = await response.json();

        if (!response.ok) throw refreshed;

        return {
          ...token,
          accessToken: refreshed.access_token,
          accessTokenExpires:
            Date.now() + (refreshed.expires_in ?? 3600) * 1000,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
        };
      } catch (error) {
        console.error("Error refreshing access token:", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
