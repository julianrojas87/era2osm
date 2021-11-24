import Config from './config';
import { Readable, Writable } from 'stream'
import rdfDeref from 'rdf-dereference';
import { ERA2OSM } from './lib/era2osm';
import { createWriteStream, writeFile } from 'fs';
import { StreamParser } from 'n3';
import { mergeStreams, map2json } from './lib/utils';
import {
    ListOfCountries,
    OPNetElements,
    SoLNetElementLocation,
    SoLNetElementConnection
} from './lib/queries';

async function run(): Promise<void> {
    const SPARQL: string = Config.SPARQL_endpoint;
    const nodeMap: Map<string, number> = new Map();
    const countries: string[] = await fetchCountries();

    const output = createWriteStream(Config.OSM_output, 'utf-8');

    for (const [i, country] of countries.entries()) {
        console.log(`Fetching railway topology data from ${country}`);
        await executePipeline(
            Readable.from(mergeStreams([
                <StreamParser>(await rdfDeref.dereference(SPARQL + OPNetElements(country))).quads,
                <StreamParser>(await rdfDeref.dereference(SPARQL + SoLNetElementConnection(country))).quads,
                <StreamParser>(await rdfDeref.dereference(SPARQL + SoLNetElementLocation(country))).quads
            ])),
            new ERA2OSM({ nodeMap, header: i === 0 }),
            output
        );
    }

    output.write('</osm>');
    output.close();
    writeFile(Config.MapId_output,
        map2json(new Map(Array.from(nodeMap, entry => [entry[1], entry[0]]))), 'utf8', () => {
            console.log(`Conversion finished successfully (converted ${nodeMap.size} topology entities)`);
    });
}

function executePipeline(quadStream: Readable, osmStream: ERA2OSM, fileWriter: Writable): Promise<null> {
    return new Promise((resolve, reject) => {
        quadStream.pipe(osmStream).on('data', (xml: string) => {
            fileWriter.write(xml);
        }).on('end', resolve);
    });
}

async function fetchCountries(): Promise<string[]> {
    const countries: string[] = [];
    const quads = <StreamParser>(await rdfDeref.dereference(Config.SPARQL_endpoint + ListOfCountries)).quads;
    for await (const quad of quads) {
        countries.push(quad.subject.value);
    }

    return countries;
}

run();