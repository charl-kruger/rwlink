"use client";

import { RequestInfo } from "rwsdk/worker";
import { useAgent } from "agents/react";
import React, { useState } from "react";

export function Home({ ctx }: RequestInfo) {
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Connect to the agent using kebab-case class name
  const agentConnection = useAgent({
    agent: "agent-object",
    name: "session-12345",
  });

  const handlePing = async () => {
    console.log("agentConnection:", agentConnection);
    console.log("agentConnection.call:", agentConnection?.call);
    console.log("agentConnection.stub:", agentConnection?.stub);

    if (!agentConnection?.call || agentConnection?.readyState !== 1) {
      setResponse("Agent connection not available");
      return;
    }

    setIsLoading(true);
    try {
      // Call the ping method using the call() method
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
      <p>
        {ctx.user?.username
          ? `You are logged in as user ${ctx.user.username}`
          : "You are not logged in"}
      </p>

      <div style={{ marginTop: "20px" }}>
        <h3>Ping/Pong Test</h3>
        <button
          onClick={handlePing}
          disabled={isLoading || agentConnection?.readyState !== 1}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || agentConnection?.readyState !== 1 ? "not-allowed" : "pointer",
            opacity: isLoading || agentConnection?.readyState !== 1 ? 0.6 : 1
          }}
        >
          {isLoading ? "Pinging..." : "Ping"}
        </button>

        {response && (
          <div style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "4px"
          }}>
            <strong>Response:</strong> {response}
          </div>
        )}

        <div style={{ marginTop: "10px", fontSize: "14px", color: "#6c757d" }}>
          Agent connection status: {agentConnection?.readyState === 1 ? "Connected" : "Disconnected"}
        </div>
      </div>
    </div>
  );
}
