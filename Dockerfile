### Multi-stage Docker image

# STAGE 1: Start from a Node.js ready container
FROM node:16 AS ERA2OSM
# Create a new directory for app files
RUN mkdir -p /opt/era2osm
# Set working directory in the container
WORKDIR /opt/era2osm
# Copy source files
COPY . .
# Install dependencies
RUN npm install
# Install envsub to parse environment variables at build time
RUN npm install -g envsub
# Define config variables
ARG SPARQL_API
# Example country for testing: http://publications.europa.eu/resource/authority/country/BEL
ARG COUNTRIES
# Parse env variables and build app
RUN envsub ./src/config.ts
RUN npm run build
# Execute ERA2OSM conversion process
RUN npm start

# STAGE 2: Start from OSRM ready container
FROM osrm/osrm-backend:v5.25.0

ARG BUILD_DATE

LABEL project="era2osm"
LABEL maintainer="Julian"
LABEL email="julianandres.rojasmelendez@ugent.be"
LABEL documentation="https://git.fpfis.eu/xxxxxx/xxxxx"
LABEL license="EUPL-1.2"

# http://label-schema.org/rc1/ for more details
LABEL org.label-schema.schema-version="1.0.0"
LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.name="era2osm"
LABEL org.label-schema.description="era2osm docker image used in ERA projects"
LABEL org.label-schema.usage="https://git.fpfis.eu/xxxxxx/xxxxx"
LABEL org.label-schema.url="https://git.fpfis.eu/xxxxxx/xxxxx"
LABEL org.label-schema.vcs-url="https://git.fpfis.eu/xxxxxx/xxxxx"
LABEL org.label-schema.version="1.2.3"

# Install Node.js v16
RUN apt-get update; apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
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
RUN osrm-extract -p /opt/car.lua /opt/osrm-data/era_osm.xml >1.log 2>&1
RUN osrm-partition /opt/osrm-data/era_osm.xml.osrm
RUN osrm-customize /opt/osrm-data/era_osm.xml.osrm
# Expose OSRM HTTP port
EXPOSE 5000
# Setup container's entrypoint script
COPY run.sh .
RUN chmod +x run.sh 
ENTRYPOINT [ "./run.sh" ]
