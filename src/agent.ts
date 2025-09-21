import { Agent, callable, Connection } from "agents";

interface AgentState {
  counter: number;
  messages: string[];
  lastUpdated: Date | null;
}

export class AgentObject extends Agent<any, AgentState> {
  // Optional initial state definition
  initialState: AgentState = {
    counter: 0,
    messages: [],
    lastUpdated: null,
  };

  // Called when a new Agent instance starts or wakes from hibernation
  async onStart() {
    console.log("Agent started with state:", this.state);
  }

  // Handle HTTP requests coming to this Agent instance
  // Returns a Response object
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ping" && request.method === "POST") {
      const result = await this.ping();
      return new Response(result, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response("Hello from Agent!");
  }

  // Called when a WebSocket connection is established
  // Access the original request via ctx.request for auth etc.
  async onConnect(connection: Connection, ctx: { request: Request }): Promise<void> {
    // Connections are automatically accepted by the SDK.
    // You can also explicitly close a connection here with connection.close()
    // Access the Request on ctx.request to inspect headers, cookies and the URL
  }

  // Called for each message received on a WebSocket connection
  // Message can be string, ArrayBuffer, or ArrayBufferView
  async onMessage(connection: Connection, message: string | ArrayBuffer | ArrayBufferView): Promise<void> {
    // Handle incoming messages
    connection.send("Received your message");
  }

  // Handle WebSocket connection errors
  async onError(connection: Connection, error: unknown): Promise<void>;
  async onError(error: unknown): Promise<void>;
  async onError(connectionOrError: Connection | unknown, error?: unknown): Promise<void> {
    if (error !== undefined) {
      // Called with connection and error
      console.error(`Connection error:`, error);
    } else {
      // Called with error only
      console.error(`General error:`, connectionOrError);
    }
  }

  // Handle WebSocket connection close events
  async onClose(connection: Connection, code: number, reason: string, wasClean: boolean): Promise<void> {
    console.log(`Connection closed: ${code} - ${reason}`);
  }

  // Called when the Agent's state is updated from any source
  // source can be "server" or a client Connection
  onStateUpdate(state: AgentState | undefined, source: Connection | "server"): void {
    console.log("State updated:", state, "Source:", source);
  }

  // You can define your own custom methods to be called by requests,
  // WebSocket messages, or scheduled tasks
  async customProcessingMethod(data: unknown): Promise<void> {
    // Process data, update state, schedule tasks, etc.
    this.setState({
      counter: this.state.counter,
      messages: this.state.messages,
      lastUpdated: new Date()
    });
  }

  // Ping method that returns "pong" - decorated to be callable from client
  @callable()
  async ping(): Promise<string> {
    console.log("Ping received, responding with pong");
    return "pong";
  }
}
