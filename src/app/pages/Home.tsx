"use client";

import { RequestInfo } from "rwsdk/worker";
import { createActor } from "@/lib/actorClient";
import React, { useState } from "react";

export function Home({ ctx }: RequestInfo) {
  const [response, setResponse] = useState<string>("");
  const [state, setState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timezone, setTimezone] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Create actor instance for RPC calls
  const actor = createActor("agent-object", "session-12345");

  const handlePing = async () => {
    setIsLoading(true);
    try {
      // Use RPC-style method call
      const result = timezone
        ? await actor.ping(timezone)
        : await actor.ping();
      setResponse(result);
    } catch (error) {
      console.error("Error calling ping:", error);
      setResponse(`Error calling ping method: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetState = async () => {
    setIsLoading(true);
    try {
      // Use RPC-style method call
      const result = await actor.getState();
      setState(result);
      setResponse(`State retrieved (counter: ${result.counter})`);
    } catch (error) {
      console.error("Error getting state:", error);
      setResponse(`Error getting state: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMessage = async () => {
    if (!message.trim()) {
      setResponse("Please enter a message");
      return;
    }

    setIsLoading(true);
    try {
      // Use RPC-style method call
      const result = await actor.addMessage(message);
      setResponse(result);
      setMessage(""); // Clear the input
    } catch (error) {
      console.error("Error adding message:", error);
      setResponse(`Error adding message: ${error.message}`);
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
        <h3>RPC Actor Test</h3>

        {/* Input fields */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Timezone (optional):
          </label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g., America/New_York, Europe/London"
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              width: "300px",
              marginBottom: "10px"
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Message:
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message to add to the actor state"
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              width: "300px"
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={handlePing}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? "Calling..." : "actor.ping()"}
          </button>

          <button
            onClick={handleAddMessage}
            disabled={isLoading || !message.trim()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ffc107",
              color: "black",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading || !message.trim() ? "not-allowed" : "pointer",
              opacity: isLoading || !message.trim() ? 0.6 : 1
            }}
          >
            {isLoading ? "Adding..." : "actor.addMessage()"}
          </button>

          <button
            onClick={handleGetState}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? "Getting..." : "actor.getState()"}
          </button>
        </div>

        {/* Response display */}
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

        {/* State display */}
        {state && (
          <div style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#e9f7ef",
            border: "1px solid #c3e6cb",
            borderRadius: "4px"
          }}>
            <strong>Actor State:</strong>
            <pre style={{ margin: "5px 0", fontSize: "12px" }}>
              {JSON.stringify(state, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: "15px", fontSize: "14px", color: "#6c757d" }}>
          Actor status: Ready | RPC-style method calls enabled
        </div>
      </div>
    </div>
  );
}
