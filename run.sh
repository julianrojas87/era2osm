#!/bin/bash

# Run the HTTP API that translates OSRM IDs to ERA URIs
cd /opt/era2osm/dist/server
node index.js &

# Start OSRM routing engine
cd /opt/osrm-data
osrm-routed --algorithm mld era_osm.xml.osrm
