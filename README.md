# Standard RedwoodSDK Starter

This "standard starter" is the recommended implementation for RedwoodSDK. You get a Typescript project with:

- Vite
- database (Prisma via D1)
- Session Management (via DurableObjects)
- Passkey authentication (Webauthn)
- Storage (via R2)

## Creating your project

```shell
npx create-rwsdk my-project-name
cd my-project-name
npm install
```

## Running the dev server

```shell
pnpm run dev
```

Point your browser to the URL displayed in the terminal (e.g. `http://localhost:5173/`). You should see a "Hello World" message in your browser.

## Deploying your app

### Wrangler Setup

Within your project's `wrangler.jsonc`:

- Replace the `__change_me__` placeholders with a name for your application

- Create a new D1 database:

```shell
npx wrangler d1 create my-project-db
```

Copy the database ID provided and paste it into your project's `wrangler.jsonc` file:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-project-db",
      "database_id": "your-database-id",
    },
  ],
}
```

### Authentication Setup

For authentication setup and configuration, including optional bot protection, see the [Authentication Documentation](https://docs.rwsdk.com/core/authentication).

## Cloudflare Agents SDK Integration

This project demonstrates a complete integration of [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/) with RedwoodSDK, enabling real-time client-server communication through WebSockets and RPC calls to Durable Objects.

### What is Cloudflare Agents SDK?

Cloudflare Agents SDK enables you to build and deploy AI-powered agents that can:
- Communicate in real-time via WebSockets
- Persist state using Durable Objects
- Call AI models and external APIs
- Schedule tasks and run workflows
- Support human-in-the-loop interactions
- Scale globally across Cloudflare's edge network

### Architecture Overview

```
┌─────────────────┐    WebSocket/HTTP     ┌─────────────────┐
│   React Client  │ ◄──────────────────► │  Cloudflare     │
│   (Browser)     │                      │  Workers        │
└─────────────────┘                      └─────────────────┘
                                                   │
                                                   ▼
                                         ┌─────────────────┐
                                         │ Agent Durable   │
                                         │ Object          │
                                         │ (Persistent)    │
                                         └─────────────────┘
```

### Implementation Details

#### 1. Agent Setup (`src/agent.ts`)

```typescript
import { Agent, callable, Connection } from "agents";

interface AgentState {
  counter: number;
  messages: string[];
  lastUpdated: Date | null;
}

export class AgentObject extends Agent<any, AgentState> {
  initialState: AgentState = {
    counter: 0,
    messages: [],
    lastUpdated: null,
  };

  // Callable methods exposed to clients
  @callable()
  async ping(): Promise<string> {
    console.log("Ping received, responding with pong");
    return "pong";
  }

  // WebSocket connection handlers
  async onConnect(connection: Connection, ctx: { request: Request }): Promise<void> {
    // Handle new client connections
  }

  async onMessage(connection: Connection, message: string | ArrayBuffer | ArrayBufferView): Promise<void> {
    // Handle incoming WebSocket messages
    connection.send("Received your message");
  }

  // HTTP request handler
  async onRequest(request: Request): Promise<Response> {
    // Handle direct HTTP requests to the agent
    return new Response("Hello from Agent!");
  }
}
```

#### 2. Worker Configuration (`src/worker.tsx`)

```typescript
import { routeAgentRequest } from "agents";

export default defineApp([
  // ... other middleware

  // Agent routing for /agents/* requests
  async ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/agents/')) {
      return await routeAgentRequest(request, env) ||
             new Response("Agent not found", { status: 404 });
    }
  },

  // ... rest of app
]);

export { AgentObject } from "./agent";
```

#### 3. Durable Object Binding (`wrangler.jsonc`)

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "AgentObject",
        "class_name": "AgentObject"
      }
    ]
  }
}
```

#### 4. React Client Integration (`src/app/pages/Home.tsx`)

```typescript
"use client";

import { useAgent } from "agents/react";

export function Home({ ctx }: RequestInfo) {
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Connect to the agent
  const agentConnection = useAgent({
    agent: "agent-object",  // kebab-case of class name
    name: "session-12345",  // unique instance identifier
  });

  const handlePing = async () => {
    if (!agentConnection?.call || agentConnection?.readyState !== 1) {
      setResponse("Agent connection not available");
      return;
    }

    setIsLoading(true);
    try {
      // Call agent method via RPC
      const result = await agentConnection.call('ping');
      setResponse(result);
    } catch (error) {
      console.error("Error calling ping:", error);
      setResponse("Error calling ping method");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePing}
        disabled={isLoading || agentConnection?.readyState !== 1}
      >
        {isLoading ? "Pinging..." : "Ping"}
      </button>

      <div>
        Agent connection status: {agentConnection?.readyState === 1 ? "Connected" : "Disconnected"}
      </div>

      {response && <div>Response: {response}</div>}
    </div>
  );
}
```

### Key Features Implemented

#### ✅ Real-time Communication
- WebSocket connections between React client and Agent Durable Object
- Automatic reconnection and state synchronization
- Bi-directional messaging

#### ✅ RPC Method Calls
- `@callable()` decorator exposes server methods to client
- Type-safe method invocation from React components
- Promise-based async/await API

#### ✅ Persistent State
- Agent state persists across connections using Durable Objects
- State updates are automatically synced to connected clients
- SQLite database integration for complex data storage

#### ✅ Scalability
- Agents run on Cloudflare's global edge network
- Automatic scaling based on demand
- Low-latency connections worldwide

### Possibilities Opened Up

#### 1. **Real-time Collaboration**
```typescript
@callable()
async updateDocument(userId: string, changes: DocumentChange[]): Promise<void> {
  // Update document state
  this.setState({
    ...this.state,
    document: applyChanges(this.state.document, changes),
    lastModified: new Date()
  });

  // Broadcast to all connected clients
  this.broadcast({ type: 'documentUpdated', changes });
}
```

#### 2. **Live Chat Systems**
```typescript
@callable()
async sendMessage(userId: string, message: string): Promise<void> {
  const chatMessage = {
    id: generateId(),
    userId,
    message,
    timestamp: new Date()
  };

  this.setState({
    ...this.state,
    messages: [...this.state.messages, chatMessage]
  });

  // Notify all participants
  this.broadcast({ type: 'newMessage', message: chatMessage });
}
```

#### 3. **Game State Management**
```typescript
@callable()
async makeMove(playerId: string, move: GameMove): Promise<GameState> {
  const newGameState = this.processMove(this.state.gameState, playerId, move);

  this.setState({
    ...this.state,
    gameState: newGameState,
    lastMove: { playerId, move, timestamp: new Date() }
  });

  return newGameState;
}
```

#### 4. **AI Agent Workflows**
```typescript
@callable()
async processWithAI(input: string): Promise<string> {
  // Call AI model
  const aiResponse = await this.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [{ role: 'user', content: input }]
  });

  // Update conversation history
  this.setState({
    ...this.state,
    conversation: [...this.state.conversation, { input, response: aiResponse }]
  });

  return aiResponse;
}
```

#### 5. **IoT Device Control**
```typescript
@callable()
async controlDevice(deviceId: string, command: DeviceCommand): Promise<DeviceStatus> {
  // Send command to external device
  const response = await fetch(`${this.env.IOT_API_URL}/devices/${deviceId}/control`, {
    method: 'POST',
    body: JSON.stringify(command)
  });

  const status = await response.json();

  // Update device state
  this.setState({
    ...this.state,
    devices: {
      ...this.state.devices,
      [deviceId]: status
    }
  });

  return status;
}
```

### Performance Benefits

1. **Edge Computing**: Agents run close to users globally
2. **Persistent Connections**: WebSockets eliminate HTTP overhead
3. **Stateful Processing**: No cold starts for subsequent requests
4. **Efficient Broadcasting**: One-to-many message distribution

### Potential Improvements

#### 1. **Type Safety**
```typescript
// Generate TypeScript types for agent methods
type AgentMethods = {
  ping(): Promise<string>;
  updateDocument(userId: string, changes: DocumentChange[]): Promise<void>;
  sendMessage(userId: string, message: string): Promise<void>;
};

const agentConnection = useAgent<AgentMethods>({
  agent: "agent-object",
  name: "session-12345"
});

// Now fully type-safe
const result = await agentConnection.call('ping'); // string
```

#### 2. **Authentication Integration**
```typescript
async onConnect(connection: Connection, ctx: { request: Request }): Promise<void> {
  // Verify JWT token from request
  const token = ctx.request.headers.get('Authorization');
  const user = await verifyToken(token);

  if (!user) {
    connection.close(1008, 'Unauthorized');
    return;
  }

  // Store user context for this connection
  connection.userData = { userId: user.id, role: user.role };
}
```

#### 3. **State Persistence**
```typescript
// Automatic database persistence
@callable()
async updateUserProfile(userId: string, profile: UserProfile): Promise<void> {
  // Update in-memory state
  this.setState({
    ...this.state,
    users: { ...this.state.users, [userId]: profile }
  });

  // Persist to D1 database
  await this.sql`
    INSERT OR REPLACE INTO user_profiles (user_id, profile_data, updated_at)
    VALUES (${userId}, ${JSON.stringify(profile)}, ${new Date().toISOString()})
  `;
}
```

#### 4. **Rate Limiting & Security**
```typescript
@callable({
  description: "Send a message to the chat",
  rateLimit: { requests: 10, window: '1m' }
})
async sendMessage(userId: string, message: string): Promise<void> {
  // Built-in rate limiting
  // Input validation
  if (message.length > 1000) {
    throw new Error('Message too long');
  }

  // Content moderation
  const isAppropriate = await this.moderateContent(message);
  if (!isAppropriate) {
    throw new Error('Message violates community guidelines');
  }

  // Process message...
}
```

### Integration with Existing RedwoodSDK Features

- **Authentication**: Agents can access session data and user context
- **Database**: Direct integration with Prisma and D1 database
- **Storage**: Access to R2 object storage for file handling
- **AI Models**: Built-in access to Cloudflare Workers AI
- **Observability**: Integrated logging and monitoring

### Getting Started

1. **Install the Agents SDK**:
   ```bash
   npm install agents
   ```

2. **Create your agent** in `src/agent.ts`

3. **Add Durable Object binding** to `wrangler.jsonc`

4. **Set up routing** in your worker

5. **Connect from React** using the `useAgent` hook

The integration provides a powerful foundation for building real-time, stateful applications that scale globally while maintaining excellent developer experience.

## Further Reading

- [RedwoodSDK Documentation](https://docs.rwsdk.com/)
- [Cloudflare Agents SDK Documentation](https://developers.cloudflare.com/agents/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/runtime-apis/secrets/)
