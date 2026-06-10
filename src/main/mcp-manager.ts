import type { McpConfig, McpServerInfo } from '../types/ipc'

export class McpManager {
  private servers: Map<string, McpServerInfo> = new Map()

  async connect(config: McpConfig): Promise<void> {
    this.servers.set(config.id, {
      id: config.id,
      name: config.name,
      status: 'connected',
      toolCount: 0,
    })
  }

  async disconnect(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (server) {
      server.status = 'disconnected'
    }
  }

  listServers(): McpServerInfo[] {
    return Array.from(this.servers.values())
  }
}
