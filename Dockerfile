### Multi-stage Docker image

# STAGE 1: Start from a Node.js ready container
FROM node:14 AS ERA2OSM
# Create a new directory for app files
RUN mkdir -p /opt/era2osm
# Set working directory in the container
WORKDIR /opt/era2osm
# Copy source files
COPY . .
# Install dependencies
RUN npm install
# Install envsub to parse environment variables at runtime
RUN npm install -g envsub
# Define config variables
ARG SPARQL_API=https://linked.ec-dataplatform.eu/sparql?default-graph-uri=http://era.europa.eu/knowledge-graph&query=
# Example country for testing: http://publications.europa.eu/resource/authority/country/BEL
ARG COUNTRIES
# Parse env variables and build app
RUN envsub ./src/config.ts && npm run build
# Execute ERA2OSM conversion process
RUN npm start

# STAGE 2: Start from OSRM ready container
FROM osrm/osrm-backend
# Install Node.js v14
RUN apt-get update; apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs \
    && curl -L https://www.npmjs.com/install.sh | sh
# Expose HTTP port for Node.js file server
EXPOSE 3000
# Create folder for input files
RUN mkdir -p /opt/osrm-data
# Set working directory in the container
WORKDIR /opt/osrm-data
# Copy OSM output from previous stage
COPY --from=ERA2OSM /opt/era2osm/era_osm.xml .
COPY --from=ERA2OSM /opt/era2osm/era2osm_map.json .
# Pre-process and import data into OSRM
RUN osrm-extract -p /opt/car.lua /opt/osrm-data/era_osm.xml >1.log 2>&1 \
    && osrm-partition /opt/osrm-data/era_osm.xml.osrm \
    && osrm-customize /opt/osrm-data/era_osm.xml.osrm
# Expose OSRM HTTP port
EXPOSE 5000
# Setup container's entrypoint script
COPY run.sh .
RUN chmod +x run.sh 
ENTRYPOINT [ "./run.sh" ]
