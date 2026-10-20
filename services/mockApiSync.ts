import * as Network from 'expo-network';
import {
  acknowledgeDelete,
  getPendingSyncItems,
  getRemoteId,
  markSynced,
} from '../database/database';
import type { SyncQueueItem } from '../models/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_MOCKAPI_BASE_URL?.replace(/\/$/, '') ?? '';
const resources = {
  Dish: process.env.EXPO_PUBLIC_MOCKAPI_DISH_RESOURCE ?? 'BIT230216_Dish',
  DishCategory: process.env.EXPO_PUBLIC_MOCKAPI_CATEGORY_RESOURCE ?? 'BIT230216_DishCategory',
} as const;

let activeSync: Promise<{ synced: number; configured: boolean }> | null = null;

async function request(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`MockAPI request failed (${response.status}).`);
  return response;
}

async function findRemoteRecord(resource: string, localId: string): Promise<Record<string, unknown> | null> {
  const url = `${API_BASE_URL}/${resource}?BIT230216_Id=${encodeURIComponent(localId)}`;
  const response = await request(url);
  const records: unknown = await response.json();
  if (Array.isArray(records)) return (records[0] as Record<string, unknown> | undefined) ?? null;
  return records && typeof records === 'object' ? records as Record<string, unknown> : null;
}

async function syncItem(item: SyncQueueItem): Promise<void> {
  const resource = resources[item.BIT230216_EntityType];
  const remoteId = await getRemoteId(item.BIT230216_EntityType, item.BIT230216_EntityId);
  if (item.BIT230216_Operation === 'DELETE') {
    const payload = JSON.parse(item.BIT230216_Payload) as Record<string, unknown>;
    const targetId = remoteId ?? (payload.BIT230216_RemoteId == null ? null : String(payload.BIT230216_RemoteId));
    if (targetId) await request(`${API_BASE_URL}/${resource}/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
    await acknowledgeDelete(item);
    return;
  }

  const payload = JSON.parse(item.BIT230216_Payload) as Record<string, unknown>;
  const existing = remoteId ? null : await findRemoteRecord(resource, item.BIT230216_EntityId);
  const targetId = remoteId ?? (existing?.id == null ? null : String(existing.id));
  const response = targetId
    ? await request(`${API_BASE_URL}/${resource}/${encodeURIComponent(targetId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    : await request(`${API_BASE_URL}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  const result = response.status === 204 ? null : await response.json().catch(() => null) as Record<string, unknown> | null;
  const savedRemoteId = targetId ?? (result?.id == null ? item.BIT230216_EntityId : String(result.id));
  await markSynced(item, savedRemoteId);
}

export async function syncPendingChanges(): Promise<{ synced: number; configured: boolean }> {
  if (activeSync) return activeSync;
  activeSync = (async () => {
    if (!API_BASE_URL) return { synced: 0, configured: false };
    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected || network.isInternetReachable === false) return { synced: 0, configured: true };
    let synced = 0;
    const items = await getPendingSyncItems();
    for (const item of items) {
      await syncItem(item);
      synced += 1;
    }
    return { synced, configured: true };
  })();
  try {
    return await activeSync;
  } finally {
    activeSync = null;
  }
}