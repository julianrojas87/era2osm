import { Transform } from 'stream';
import { createCB } from 'xmlbuilder2';
import { parse as wktParse } from 'wellknown';
import { OSMNode, OSMWay } from '../types/types';
import { XMLBuilderCB } from 'xmlbuilder2/lib/interfaces';
import { Quad } from '@rdfjs/types';

export class ERA2OSM extends Transform {

    readonly LINKEDTO: string = "http://data.europa.eu/949/linkedTo";
    readonly ASWKT: string = "http://www.opengis.net/ont/geosparql#asWKT";
    readonly timestamp: string = "2021-09-06T17:01:27Z";

    private xml: XMLBuilderCB;
    private wayIdMap: Map<string, number> = new Map();
    private nodeIdMap: Map<string, number>;

    constructor(map: Map<string, number>) {
        super({ objectMode: true });

        this.xml = createCB({
            prettyPrint: true,
            data: (text: string) => this.push(text)
        });

        this.nodeIdMap = map;

        this.xml.dec({ "encoding": "UTF-8" });
        this.xml.ele('osm', { 'version': '0.6', 'generator': 'osmium/1.8.0' });
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
            }
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

    private getNumericId(uri: string, map: Map<string, number>): number {
        if(map.has(uri)) {
            return map.get(uri)!;
        } else {
            const id = map.size + 1;
            map.set(uri, id);
            return id;
        }
    }

    private emitXMLElement(element: OSMNode | OSMWay): void {
        this.xml.ele(element);
    }

    _flush(done: Function) {
        this.xml.up().end();
        done();
    }
}