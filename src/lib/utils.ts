import { Readable } from 'stream';
import { MapObject } from '../types/types';

export async function* mergeStreams(streams: Readable[]) {
    for (const stream of streams) {
        for await (const quad of stream) {
            yield quad;
        }
    }
}

export function map2json(map: Map<string, MapObject>): string {
    return JSON.stringify([...map]);
}