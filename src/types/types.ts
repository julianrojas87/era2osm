export interface OSMBuilderOptions {
    header: boolean,
    nodeMap: Map<string, MapObject>
}

export type OSMNode = {
    node: {
        '@id': string,
        '@version': number,
        '@timestamp': string,
        '@lat': number,
        '@lon': number
    }
}

export type OSMWay = {
    way: {
        '@id': string,
        '@version': number,
        '@timestamp': string,
        nd: Array<{ '@ref': string }>,
        tag: { '@k': string, '@v': string }
    }
}

export type MapObject = {
    id: string,
    lngLat?: [number, number],
    length?: number
}