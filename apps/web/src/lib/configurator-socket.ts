'use client';

import { io, type Socket } from 'socket.io-client';
import { API_BASE } from './api';

let cached: Socket | null = null;

function socketOrigin(): string {
  try {
    const u = new URL(API_BASE);
    return `${u.protocol}//${u.host}`;
  } catch {
    return 'http://localhost:4000';
  }
}

export function getConfiguratorSocket(): Socket {
  if (cached && cached.connected) return cached;
  if (cached) {
    cached.connect();
    return cached;
  }
  cached = io(`${socketOrigin()}/configurator`, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  return cached;
}

export function disposeConfiguratorSocket(): void {
  cached?.disconnect();
  cached = null;
}
