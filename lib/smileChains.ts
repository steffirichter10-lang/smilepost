import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { bilt } from '@/lib/bilt';

const TRACKERS_KEY = 'smile-chain-trackers';

export type SmileTracker = {
  trackerToken: string;
  createdAt: string;
};

export type SmileChainNode = {
  id: string;
  parentId: string | null;
  generation: number;
  confirmedAt: string;
  latitude: number | null;
  longitude: number | null;
};

export type SmileChainSummary = {
  trackerToken: string;
  startedAt: string;
  confirmedSmiles: number;
  totalShares: number;
  generations: number;
  nodes: SmileChainNode[];
};

type ChainLink = {
  shareToken: string;
  trackerToken: string;
};

type RpcObject = Record<string, unknown>;

function asObject(value: unknown): RpcObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Ungültige Antwort: ${field} fehlt.`);
  }
  return value;
}

function numberValue(value: unknown): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

export async function createChainLink(parentToken?: string): Promise<ChainLink> {
  const response = parentToken
    ? await bilt.rpc('create_smile_forward', { token: parentToken })
    : await bilt.rpc('create_smile_chain');

  if (response.error) throw new Error(response.error.message);
  const result = asObject(response.data);
  if (!result || result.ok !== true)
    throw new Error('Der Smile-Link konnte nicht erstellt werden.');

  const chainLink = {
    shareToken: requiredString(result.shareToken, 'shareToken'),
    trackerToken: requiredString(result.trackerToken, 'trackerToken'),
  };
  await saveTracker(chainLink.trackerToken);
  return chainLink;
}

export function buildSmileUrl(token: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const url = new URL('/smile', window.location.origin);
    url.searchParams.set('token', token);
    return url.toString();
  }
  return Linking.createURL('/smile', { queryParams: { token } });
}

export async function resolveSmile(token: string) {
  const { data, error } = await bilt.rpc('resolve_smile_link', { token });
  if (error) throw new Error(error.message);
  const result = asObject(data);
  if (!result || result.ok !== true) throw new Error('Dieser Smile-Link ist nicht mehr gültig.');
  return {
    generation: numberValue(result.generation),
    confirmed: Boolean(result.confirmed),
  };
}

export async function confirmSmile(
  token: string,
  coordinates?: { latitude: number; longitude: number },
) {
  const { data, error } = await bilt.rpc('confirm_smile_received_with_location', {
    token,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
  });
  if (error) throw new Error(error.message);
  const result = asObject(data);
  if (!result || result.ok !== true) throw new Error('Der Smile konnte nicht bestätigt werden.');
}

export async function loadSmileSummaries(): Promise<SmileChainSummary[]> {
  const trackers = await loadTrackers();
  const summaries = await Promise.all(
    trackers.map(async ({ trackerToken }) => {
      const { data, error } = await bilt.rpc('get_smile_chain_summary', {
        tracker_token: trackerToken,
      });
      if (error) return null;
      const result = asObject(data);
      if (!result || result.ok !== true) return null;
      const nodes = Array.isArray(result.nodes)
        ? result.nodes.flatMap((value): SmileChainNode[] => {
            const node = asObject(value);
            if (!node || typeof node.id !== 'string' || typeof node.confirmedAt !== 'string')
              return [];
            return [
              {
                id: node.id,
                parentId: typeof node.parentId === 'string' ? node.parentId : null,
                generation: numberValue(node.generation),
                confirmedAt: node.confirmedAt,
                latitude: node.latitude === null ? null : numberValue(node.latitude),
                longitude: node.longitude === null ? null : numberValue(node.longitude),
              },
            ];
          })
        : [];
      return {
        trackerToken,
        startedAt: requiredString(result.startedAt, 'startedAt'),
        confirmedSmiles: numberValue(result.confirmedSmiles),
        totalShares: numberValue(result.totalShares),
        generations: numberValue(result.generations),
        nodes,
      };
    }),
  );
  return summaries.filter((summary): summary is SmileChainSummary => summary !== null);
}

async function loadTrackers(): Promise<SmileTracker[]> {
  const stored = await AsyncStorage.getItem(TRACKERS_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): SmileTracker[] => {
      const tracker = asObject(item);
      if (
        !tracker ||
        typeof tracker.trackerToken !== 'string' ||
        typeof tracker.createdAt !== 'string'
      ) {
        return [];
      }
      return [{ trackerToken: tracker.trackerToken, createdAt: tracker.createdAt }];
    });
  } catch {
    return [];
  }
}

async function saveTracker(trackerToken: string) {
  const trackers = await loadTrackers();
  if (trackers.some((tracker) => tracker.trackerToken === trackerToken)) return;
  await AsyncStorage.setItem(
    TRACKERS_KEY,
    JSON.stringify([{ trackerToken, createdAt: new Date().toISOString() }, ...trackers]),
  );
}
