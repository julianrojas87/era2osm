import fs from "fs";
import fastify from "fastify";
import undici from "undici";

interface IQuerystring {
    path: string
}

// Load OSRM index file
const index = new Map(JSON.parse(fs.readFileSync('/opt/era2osm/era2osm_map.json', 'utf8')));
const server = fastify({ logger: true });

server.get<{ Querystring: IQuerystring }>('/osrm', async (request, response) => {
    const { path } = request.query;
    const routeQuery: string = `http://localhost:5000/route/v1/driving/${path}?annotations=true`;
    const { body } = await undici.request(routeQuery);
    const rawRes = await body.json();

    const route = [];

    if (rawRes.routes && rawRes.routes.length > 0) {
        for (const leg of rawRes.routes[0].legs) {
            for (const node of leg.annotation.nodes) {
                route.push(index.get(node.toString()));
            }
        }
    }

    response.header('Access-Control-Allow-Origin', '*');
    response.header('content-type', 'application/json');
    response.header('Cache-control', 'no-store');

    return route;
});

server.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log(`Server listening at ${address}`)
});