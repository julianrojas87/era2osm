export type OSMNode = {
    node: {
        '@id': number,
        '@version': number,
        '@timestamp': string,
        '@lat': number,
        '@lon': number
    }
}

export type OSMWay = {
    way: {
        '@id': number,
        '@version': number,
        '@timestamp': string,
        nd: Array<{ '@ref': number }>,
        tag: { '@k': string, '@v': string }
    }
}