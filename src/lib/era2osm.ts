import { Transform } from 'stream';
import { createCB, fragmentCB } from 'xmlbuilder2';
import { parse as wktParse } from 'wellknown';
import { OSMNode, OSMWay, OSMBuilderOptions, MapObject } from '../types/types';
import { XMLBuilderCB } from 'xmlbuilder2/lib/interfaces';
import { Quad } from '@rdfjs/types';

export class ERA2OSM extends Transform {

    readonly LINKEDTO: string = "http://data.europa.eu/949/linkedTo";
    readonly LENGTH: string = "http://data.europa.eu/949/length";
    readonly ASWKT: string = "http://www.opengis.net/ont/geosparql#asWKT";
    readonly timestamp: string = "2021-09-06T17:01:27Z";

    private xml: XMLBuilderCB;
    private wayIdMap: Map<string, MapObject> = new Map();
    private nodeIdMap: Map<string, MapObject>;

    constructor(options: OSMBuilderOptions) {
        super({ objectMode: true });

        if (options.header) {
            this.xml = createCB({
                prettyPrint: true,
                data: (text: string) => this.push(text)
            });

            this.xml.dec({ "encoding": "UTF-8" });
            this.xml.ele('osm', { 'version': '0.6', 'generator': 'osmium/1.8.0' });
        } else {
            this.xml = fragmentCB({
                prettyPrint: true,
                data: (text: string) => this.push(text)
            });
        }

        this.nodeIdMap = options.nodeMap;
    }

    _transform(quad: Quad, encoding: string, done: Function) {
        if (quad.predicate.value === this.ASWKT) {
            const [lon, lat] = wktParse(quad.object.value)!.coordinates;
            if (typeof lat === 'number' && typeof lon === 'number') {
                // Emit XML node
                this.emitXMLElement({
                    node: {
                        '@id': this.getNumericId(quad.subject.value, this.nodeIdMap),
                        '@version': 1,
                        '@timestamp': this.timestamp,
                        '@lat': lat,
                        '@lon': lon
                    }
                });
                // Store geo information in the ID map
                this.nodeIdMap.get(quad.subject.value)!['lngLat'] = [lon, lat];
            }
        } else if(quad.predicate.value === this.LENGTH) {
            // Make sure the node exists in ID map
            this.getNumericId(quad.subject.value, this.nodeIdMap);
            // Store length information in the ID map
            this.nodeIdMap.get(quad.subject.value)!['length'] = parseFloat(quad.object.value);
        } else if (quad.predicate.value === this.LINKEDTO) {
            // Emit OSM Way
            this.emitXMLElement({
                way: {
                    '@id': this.getNumericId(quad.subject.value + '_' + quad.object.value, this.wayIdMap),
                    '@version': 1,
                    '@timestamp': this.timestamp,
                    nd: [
                        { '@ref': this.getNumericId(quad.subject.value, this.nodeIdMap) },
                        { '@ref': this.getNumericId(quad.object.value, this.nodeIdMap) }
                    ],
                    tag: { '@k': 'highway', '@v': 'unclassified' }
                }
            });
        }
        done();
    }

    private getNumericId(uri: string, map: Map<string, MapObject>): string {
        if (map.has(uri)) {
            return map.get(uri)!.id;
        } else {
            const id = `${map.size + 1}`;
            map.set(uri, { id });
            return id;
        }
    }

    private emitXMLElement(element: OSMNode | OSMWay): void {
        this.xml.ele(element);
    }
}