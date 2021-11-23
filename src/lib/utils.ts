import { Readable } from 'stream';

export async function* mergeStreams(streams: Readable[]) {
    for (const stream of streams) {
        for await (const quad of stream) {
            yield quad;
        }
    }
}

export function map2json(map: Map<string, number>): string {
    return JSON.stringify([...map]);
}