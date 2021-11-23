export const OPNetElements = (country: string): string => {
    return encodeURIComponent(`
    PREFIX era: <http://data.europa.eu/949/>
    PREFIX geosparql: <http://www.opengis.net/ont/geosparql#>
    PREFIX wgs: <http://www.w3.org/2003/01/geo/wgs84_pos#>
    PREFIX era-nv: <http://data.europa.eu/949/concepts/navigabilities/>
    PREFIX eu-country: <http://publications.europa.eu/resource/authority/country/>
    CONSTRUCT {
        ?opne geosparql:asWKT ?wkt;
            era:linkedTo ?nextNe.
    } WHERE {
        ?opne a era:NetElement;
            ^era:elementPart [ era:hasImplementation ?OP ].

        ?OP a era:OperationalPoint;
            era:inCountry eu-country:${country};
            wgs:location [ 
            geosparql:asWKT ?wkt;
        ].

        VALUES ?navAB { era-nv:AB era-nv:Both }
        VALUES ?navBA { era-nv:BA era-nv:Both }

        {
            ?nr1 a era:NetRelation;
                era:elementA ?opne;
                era:elementB ?nextNe;
                era:navigability ?navAB.   
        }
        UNION
        {
            ?nr2 a era:NetRelation;
                era:elementA ?nextNe;
                era:elementB ?opne;
                era:navigability ?navBA.
        }
    }`);
}

export const SoLNetElementLocation = (country: string): string =>{
    return encodeURIComponent(`
    PREFIX geosparql: <http://www.opengis.net/ont/geosparql#>
    PREFIX era: <http://data.europa.eu/949/>
    PREFIX wgs: <http://www.w3.org/2003/01/geo/wgs84_pos#>
    PREFIX eu-country: <http://publications.europa.eu/resource/authority/country/>
    CONSTRUCT {
        ?solNe geosparql:asWKT ?wkt.
    } WHERE {
        ?SOL a era:SectionOfLine;
            era:inCountry eu-country:${country};
            era:hasAbstraction [ era:elementPart ?solNe ];
            era:opStart ?inOP;
            era:opEnd ?outOP.
    
        ?inOP wgs:location [
            wgs:lat ?latIn;
            wgs:long ?lonIn
        ].
        
        ?outOP wgs:location [
            wgs:lat ?latOut;
            wgs:long ?lonOut
        ].
        
        BIND(CONCAT("POINT(", str((?lonIn + ?lonOut) / 2), " ", str((?latIn + ?latOut) / 2), ")") AS ?wkt)
    }`);
}

export const SoLNetElementConnection = (country: string): string =>{
    return encodeURIComponent(`
    PREFIX era: <http://data.europa.eu/949/>
    PREFIX geosparql: <http://www.opengis.net/ont/geosparql#>
    PREFIX wgs: <http://www.w3.org/2003/01/geo/wgs84_pos#>
    PREFIX era-nv: <http://data.europa.eu/949/concepts/navigabilities/>
    PREFIX eu-country: <http://publications.europa.eu/resource/authority/country/>
    CONSTRUCT {
        ?solne era:linkedTo ?opne.
    } WHERE {
        ?opne a era:NetElement;
            ^era:elementPart [ era:hasImplementation ?OP ].

        ?OP a era:OperationalPoint.

        ?solne a era:NetElement;
            ^era:elementPart [ era:hasImplementation ?SoL ].

        ?SoL a era:SectionOfLine;
            era:inCountry eu-country:${country};
            era:opStart|era:opEnd ?OP.

        VALUES ?navAB { era-nv:AB era-nv:Both }
        VALUES ?navBA { era-nv:BA era-nv:Both }

        {
            ?nr1 a era:NetRelation;
                era:elementA ?solne;
                era:elementB ?opne;
                era:navigability ?navAB.
        }
        UNION
        {
            ?nr2 a era:NetRelation;
                era:elementA ?opne;
                era:elementB ?solne;
                era:navigability ?navBA.
        }
    }`);
}