"use client";
import React, { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleLogOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          console.log("onSuccess");
          router.push("/");
          setLoading(false);
        },
        onRequest: (ctx) => {
          console.log("onRequest");
          setLoading(true);
        },
        onResponse: (ctx) => {
          console.log("onResponse", ctx);
          setLoading(false);
        },
      },
    });
  }
  return (
    <button onClick={() => handleLogOut()}>
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}
