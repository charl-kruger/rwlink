import "reflect-metadata";
import { Actor } from "@cloudflare/actors";
import { callable, dispatchRpcCall } from "@/lib/callable";

interface Env {
  // Add any environment bindings here
}

interface AgentState {
  counter: number;
  messages: string[];
  lastUpdated: Date | null;
}

export class AgentObject extends Actor<Env> {
  private state: AgentState = {
    counter: 0,
    messages: [],
    lastUpdated: null,
  };

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle RPC calls with automatic method dispatch
    if (url.pathname.endsWith("/rpc") && request.method === "POST") {
      try {
        const body = await request.json();
        const { method, params = [] } = body;

        // Use automatic method dispatch
        const result = await dispatchRpcCall(this, method, params);

        return new Response(JSON.stringify({ result }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Hello from Actor!");
  }

  @callable()
  async ping(timezone?: string): Promise<string> {
    console.log("Ping received, responding with pong", timezone ? `for timezone: ${timezone}` : "");

    // Update state
    this.state = {
      ...this.state,
      counter: this.state.counter + 1,
      lastUpdated: new Date(),
      messages: [...this.state.messages, `ping ${timezone || 'default'} at ${new Date().toISOString()}`].slice(-10) // Keep last 10 messages
    };

    await this.storage.raw?.put("state", this.state);

    if (timezone) {
      const now = new Date();
      return `pong from ${timezone} at ${now.toLocaleString('en-US', { timeZone: timezone })}`;
    }

    return "pong";
  }

  @callable()
  async getState(): Promise<AgentState> {
    const stored = await this.storage.raw?.get<AgentState>("state");
    return stored || this.state;
  }

  @callable()
  async addMessage(message: string): Promise<string> {
    console.log("Adding message:", message);

    this.state = {
      ...this.state,
      messages: [...this.state.messages, `${message} at ${new Date().toISOString()}`].slice(-10)
    };

    await this.storage.raw?.put("state", this.state);
    return `Message "${message}" added successfully`;
  }

  // This method is NOT marked with @callable - should not be accessible via RPC
  async dangerousMethod(): Promise<string> {
    console.log("This should not be callable from RPC!");
    return "This method should not be accessible";
  }
}
