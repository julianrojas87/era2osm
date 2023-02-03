#!/bin/bash

# Run an HTTP server to serve ID map file
cd /opt/era2osm/dist/server
ls
node index.js &

# Start OSRM routing engine
cd /opt/osrm-data
osrm-routed --algorithm mld era_osm.xml.osrm
