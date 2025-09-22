interface ActorMethods {
  ping(timezone?: string): Promise<string>;
  getState(): Promise<any>;
  addMessage(message: string): Promise<string>;
}

class ActorProxy implements ActorMethods {
  constructor(
    private actorName: string,
    private actorId: string
  ) {}

  private async callMethod(method: string, params?: any[]): Promise<any> {
    const response = await fetch(`/actors/${this.actorName}/${this.actorId}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        params: params || []
      })
    });

    if (!response.ok) {
      throw new Error(`RPC call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`RPC error: ${result.error}`);
    }

    return result.result;
  }

  async ping(timezone?: string): Promise<string> {
    return this.callMethod('ping', timezone ? [timezone] : []);
  }

  async getState(): Promise<any> {
    return this.callMethod('getState', []);
  }

  async addMessage(message: string): Promise<string> {
    return this.callMethod('addMessage', [message]);
  }
}

export function createActor(actorName: string, actorId: string): ActorMethods {
  return new ActorProxy(actorName, actorId);
}