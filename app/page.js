"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-pulse text-black font-medium">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-black">
          Analytics UTN
        </h1>
        <p className="text-gray-500 text-sm">
          Centro de Elearning de la UTN FRBA
        </p>

        <div className="pt-8">
          <button
            onClick={() => signIn("google")}
            className="flex items-center justify-center w-full py-3 px-4 border border-black text-black bg-white hover:bg-gray-50 transition-colors duration-200 rounded-md font-medium"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Iniciar sesión con Google
          </button>
        </div>
      </div>
    </div>
  );
}
