import { defineApp, ErrorResponse } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
import { Document } from "@/app/Document";
import { Home } from "@/app/pages/Home";
import { setCommonHeaders } from "@/app/headers";
import { userRoutes } from "@/app/pages/user/routes";
import { sessions, setupSessionStore } from "./session/store";
import { Session } from "./session/durableObject";
import { type User, db, setupDb } from "@/db";
import { env } from "cloudflare:workers";
import { AgentObject } from "./agent";
export { SessionDurableObject } from "./session/durableObject";
export { AgentObject } from "./agent";

export type AppContext = {
  session: Session | null;
  user: User | null;
};

export default defineApp([
  setCommonHeaders(),
  async ({ ctx, request, headers }) => {
    await setupDb(env);
    setupSessionStore(env);

    try {
      ctx.session = await sessions.load(request);
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 401) {
        await sessions.remove(request, headers);
        headers.set("Location", "/user/login");

        return new Response(null, {
          status: 302,
          headers,
        });
      }

      throw error;
    }

    if (ctx.session?.userId) {
      ctx.user = await db.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
      });
    }
  },
  // Handle actor routing for /actors/* requests
  async ({ request, ctx }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/actors/')) {
      // Extract actor name and ID from URL path
      const pathParts = url.pathname.split('/');
      if (pathParts.length >= 4) {
        const actorName = pathParts[2];
        const actorId = pathParts[3];

        if (actorName === 'agent-object') {
          // Get the Durable Object stub using the binding from wrangler.jsonc
          const durableObjectId = env.AgentObject.idFromName(actorId);
          const actorStub = env.AgentObject.get(durableObjectId);
          return await actorStub.fetch(request);
        }
      }
      return new Response("Actor not found", { status: 404 });
    }
  },
  render(Document, [
    route("/", Home),
    route("/protected", [
      ({ ctx }) => {
        if (!ctx.user) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/user/login" },
          });
        }
      },
      Home,
    ]),
    prefix("/user", userRoutes),
  ]),
]);
