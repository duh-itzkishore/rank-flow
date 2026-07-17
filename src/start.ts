import { createStart, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest();
  const accept = request?.headers?.get("accept") || "";
  const url = request?.url || "";
  const isHtml = accept.includes("text/html");
  const isServerFnOrApi = url.includes("/_server") || url.includes("/api/") || request?.headers?.get("x-server-fn-id");

  if (!isHtml || isServerFnOrApi) {
    return await next();
  }

  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("Error caught by middleware:", error);

    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
