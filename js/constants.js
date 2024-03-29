const CONST_MAP_DEFAULT_LONGITUDEX      = -95.891431;
const CONST_MAP_DEFAULT_LATITUDEY       =  36.096613;
const CONST_MAP_INITIAL_ZOOM            =   6;

const CONST_MAP_JSON_URL                = "https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn";
const CONST_JSON_UPDATE_TIME            = 60000;    // how often to poll for JSON data from server in ms

const CONST_MAP_INCIDENT_ZOOM           = 15;
const CONST_MAP_AUTOZOOM_TO_INCIDENT    = true;

const CONST_MARKER_COLOR_RED            = "./images/marker-icon-red.png";
const CONST_MARKER_COLOR_YELLOW         = "./images/marker-icon-yellow.png";
const CONST_MARKER_COLOR_BLUE           = "./images/marker-icon-blue.png";

const CONST_PIN_ANCHOR                  = new L.Point(25/2, 41);

const CONST_MARKER_RED                  = new L.Icon({ iconUrl: CONST_MARKER_COLOR_RED,    iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });
const CONST_MARKER_YELLOW               = new L.Icon({ iconUrl: CONST_MARKER_COLOR_YELLOW, iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });
const CONST_MARKER_BLUE                 = new L.Icon({ iconUrl: CONST_MARKER_COLOR_BLUE,   iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });

const CONST_HELP_PAGE                   = "https://github.com/greghorne/TFD";
const CONST_HELP_TOOL_TIP               = "Click for Help";
const CONST_HOTSPOT_TOOL_TIP            = "toggle hotspot map"

const CONST_CITYGRAM_PAGE               = "https://www.citygram.org/tulsa";
const CONST_CITYGRAM_TOOL_TIP           = "Citygram - Tulsa";

const CONST_OLDEST_RECENT_INCIDENT      = "oldest recent incident";
const CONST_NEWEST_RECENT_INCIDENT      = "newest recent incident";
const CONST_VEHICLES_STRING             = "<table></br>Responding Vehicle(s):</br>";

const CONST_RED_MARKER_MAX_COUNT        =  1;     // leave as 1; code not implemented for other values
const CONST_YELLOW_MARKER_DEFAULT_COUNT = 10;     // default number of yellow markers to display
const CONST_YELLOW_MARKER_MAX_COUNT     = 20;      // max url param 'recent' value

const CONST_3D_BUILDINGS_URL            = 'https://{s}.data.osmbuildings.org/0.3/anonymous/tile/{z}/{x}/{y}.json';


// definition of map layers; first layer is the default layer displayed
const CONST_MAP_LAYERS = [
    {
        name: "Basic OSM",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        minZoom:  5,
        maxZoom: 17
    },
    {
        name: "Esri OSM",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
        minZoom:  5,
        maxZoom: 17
    },
    {
        name: "Esri World Imagery",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        minZoom:  5,
        maxZoom: 17
    }
];

const CONST_SLIDEOUT_DELAY_TIME = 500
const CONST_SLIDEOUT_HTML       =  "</br> \
                                    <hr size='3' align='center' color='#5e9ca0'>\
                                        <center><input type='checkbox' id='hotspot' onclick='doHotSpotMap(\"checkbox\")'> Heat Map On/Off</center></br> \
                                        <center>Incident Type:&#32;&#32;\
                                            <select id=incident_types name=incient_types onchange='doHotSpotMap(\"pulldown\");'>\
                                            </select>\
                                        </center>\
                                    <hr size='3' align='center' color='#5e9ca0'>"
                                    // </br>"
                                    // <hr size='3' align='center' color='#5e9ca0'>\
                                    // <h6 style='color: #5e9ca0; text-align: center;'>Settings</h2>\
                                    // <hr size='3' align='center' color='#5e9ca0'>"
