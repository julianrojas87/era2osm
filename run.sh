#!/bin/bash

# Run an HTTP server to serve ID map file
cd /opt/osrm-data
npx http-server -p 3000 &

# Start OSRM routing engine
osrm-routed --algorithm mld era_osm.xml.osrm
