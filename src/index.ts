import Config from './config';
import { pipeline, Readable } from 'stream'
import rdfDeref from 'rdf-dereference';
import { ERA2OSM } from './lib/era2osm';
import { createWriteStream, writeFile } from 'fs';
import { StreamParser } from 'n3';
import { mergeStreams, map2json } from './lib/utils';
import { OPNetElements, SoLNetElementLocation, SoLNetElementConnection } from './lib/queries';


const SPARQL: string = "https://linked.ec-dataplatform.eu/sparql?"
    + "default-graph-uri=http://era.europa.eu/knowledge-graph&query=";

const countries: string[] = Config.Covered_countries;

async function run() {
    const quads: Readable[] = [];
    const nodeIdMap: Map<string, number> = new Map();

    for (const country of countries) {
        quads.push(
            <StreamParser>(await rdfDeref.dereference(SPARQL + OPNetElements(country))).quads,
            <StreamParser>(await rdfDeref.dereference(SPARQL + SoLNetElementLocation(country))).quads,
            <StreamParser>(await rdfDeref.dereference(SPARQL + SoLNetElementConnection(country))).quads
        );
    }
    pipeline(
        Readable.from(mergeStreams(quads)),
        new ERA2OSM(nodeIdMap),
        createWriteStream(Config.OSM_output, 'utf-8'),
        (err) => {
            if (err) console.error(err);
            writeFile(Config.MapId_output, map2json(nodeIdMap), 'utf8', (err) => {
                console.log('Conversion finished successfully');
            })
        }
    );
}

run();