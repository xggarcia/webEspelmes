import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  CONFIGURATOR_EVENTS,
  ConfiguratorPatchSchema,
  type ConfiguratorState,
} from '@espelmes/shared';
import { ConfiguratorService } from './configurator.service';

type SessionData = {
  userId?: string;
  state?: ConfiguratorState;
};

@WebSocketGateway({
  namespace: '/configurator',
  cors: { origin: true, credentials: true },
})
export class ConfiguratorGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ConfiguratorGateway.name);
  private readonly sessions = new Map<string, SessionData>();

  constructor(
    private readonly service: ConfiguratorService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(client: Socket): void {
    const userId = this.tryAuthenticate(client);
    this.sessions.set(client.id, { userId });
    this.logger.debug(`configurator connected: ${client.id} user=${userId ?? 'anon'}`);
  }

  handleDisconnect(client: Socket): void {
    this.sessions.delete(client.id);
  }

  @SubscribeMessage(CONFIGURATOR_EVENTS.Join)
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { productId?: unknown },
  ): Promise<void> {
    const productId = typeof body?.productId === 'string' ? body.productId : '';
    if (!productId) {
      client.emit(CONFIGURATOR_EVENTS.Error, { code: 'MISSING_PRODUCT_ID' });
      return;
    }
    try {
      const product = await this.service.loadProduct(productId);
      const state = this.service.buildInitialState(product);
      this.sessions.set(client.id, { ...this.sessions.get(client.id), state });
      const payload = await this.service.quote(state);
      client.emit(CONFIGURATOR_EVENTS.State, payload);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage(CONFIGURATOR_EVENTS.Update)
  async onUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const session = this.sessions.get(client.id);
    if (!session?.state) {
      client.emit(CONFIGURATOR_EVENTS.Error, { code: 'NO_ACTIVE_SESSION' });
      return;
    }
    const parsed = ConfiguratorPatchSchema.safeParse(body);
    if (!parsed.success) {
      client.emit(CONFIGURATOR_EVENTS.Error, {
        code: 'INVALID_PATCH',
        details: parsed.error.flatten(),
      });
      return;
    }
    try {
      const next = this.service.mergePatch(session.state, parsed.data);
      session.state = next;
      const payload = await this.service.quote(next);
      client.emit(CONFIGURATOR_EVENTS.State, payload);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  private emitError(client: Socket, err: unknown): void {
    const e = err as { response?: { code?: string; message?: string }; message?: string };
    client.emit(CONFIGURATOR_EVENTS.Error, {
      code: e?.response?.code ?? 'CONFIGURATOR_ERROR',
      message: e?.response?.message ?? e?.message ?? 'Error',
    });
  }

  private tryAuthenticate(client: Socket): string | undefined {
    try {
      const cookieHeader = client.handshake.headers.cookie ?? '';
      const match = /access_token=([^;]+)/.exec(cookieHeader);
      const token = match?.[1] ?? (client.handshake.auth?.token as string | undefined);
      if (!token) return undefined;
      const payload = this.jwt.verify<{ sub?: string }>(token);
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
