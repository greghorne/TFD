//////////////////////////////////////////////////////////////////////
const CONST_MAP_DEFAULT_LONGITUDEX    = -95.891431
const CONST_MAP_DEFAULT_LATITUDEY     =  36.096613
const CONST_MAP_DEFAULT_ZOOM          =  10

const CONST_MAP_JSON_URL              = "https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn"
const CONST_JSON_UPDATE_TIME          = 60000    // how often to poll for JSON data from server in ms

const CONST_MAP_INCIDENT_ZOOM         = 15
const CONST_MAP_AUTOZOOM_TO_INCIDENT  = true

const CONST_PIN_ANCHOR           = new L.Point(25/2, 41);
const CONST_MARKER_COLOR_RED     = "./images/marker-icon-red.png";
const CONST_MARKER_COLOR_YELLOW  = "./images/marker-icon-yellow.png"
const CONST_MARKER_COLOR_BLUE    = "./images/marker-icon-blue.png"

const CONST_MARKER_RED           = new L.Icon({ iconUrl: CONST_MARKER_COLOR_RED,    iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });
const CONST_MARKER_YELLOW        = new L.Icon({ iconUrl: CONST_MARKER_COLOR_YELLOW, iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });
const CONST_MARKER_BLUE          = new L.Icon({ iconUrl: CONST_MARKER_COLOR_BLUE,   iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });

const CONST_HELP_PAGE            = "https://github.com/greghorne/TFD"
const CONST_CITYGRAM_PAGE        = "https://www.citygram.org/tulsa"

const CONST_RED_MARKER_MAX_COUNT    =  1     // leave as 1; not test with other values
const CONST_YELLOW_MARKER_MAX_COUNT = 10

// definition of map layers; first layer is the default layer displayed
const CONST_MAP_LAYERS = [
    {
        name: "Grayscale OSM",
        url: "http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png",
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
        name: "Hydda OSM",
        url: "https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png",
        attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        minZoom:  5,
        maxZoom: 17
    },
    {
        name: "Basic OSM",
        url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
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
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// prepare indexedDB 
var deleteIndexedDB = window.indexedDB.deleteDatabase("TFD")
var indexedDB       = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

// prefixes of window.IDB objects
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange    = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
 
function updateIndexedDB(json) {

    var db = indexedDB.open("TFD", 1);

    db.onupgradeneeded = function() {
        var database    = db.result;
        var store       = database.createObjectStore("Incidents", {keyPath: "incidentNumber", unique: true});
    }

    db.onsuccess = function() {
        var database = db.result
        var tx       = database.transaction(["Incidents"], "readwrite");
        var store    = tx.objectStore("Incidents");

        var incidentsCount = json.Incidents.Incident.length;

        for (var n = 0; n < incidentsCount; n++) {  // iterate through json
            var incident    = json.Incidents.Incident[n];
            var vehiclesArr = getVehicles(incident.Vehicles);
            // 'put' will update a record if it exists or create a new one.
            store.put({ incidentNumber: incident.IncidentNumber, problem: incident.Problem, address: incident.Address, date: incident.ResponseDate, lat: incident.Latitude, lng: incident.Longitude, vehicles: vehiclesArr })
        }

        tx.oncomplete = function() {
            database.close;
        }
    };
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// returns an array of vehicles 
function getVehicles(vehicles) {

    // if vehicles = 1; then it is a key value pair object that needs to be put into an array
    // if vehicles > 1; then it is alread an array of key value pairs so just return it

    if (vehicles.Vehicle.Division) {
        var vehiclesArr = [];
        vehiclesArr.push( {division: vehicles.Vehicle.Division, station: vehicles.Vehicle.Station, vehicleID: vehicles.Vehicle.VehicleID} )
        return vehiclesArr;
    }
    return vehicles;
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// build vehicle(s) html string
function buildVehicleHTMLString(vehicles, fnCallback) {
    
    var vehiclesArr = [];
    var vehiclesString = "<table></br>Responding Vehicle(s):</br>"

    if (vehicles.Division) {    
        // only 1 vehicle; object of key, value
        var vehicleID = vehicles.VehicleID
        if (vehicleID == null) vehicleID = "";      // on occasion it has been observed that the VehicleID = null, use empty string instead
        vehiclesString += "</tr><td>" + vehicles.Division + "</td><td>" + vehicles.Station + "</td><td>" + vehicleID + "</td>"
        vehiclesArr.push( {division: vehicles.Division, station: vehicles.Station, vehicleID: vehicles.VehicleID} )
    } else {
        // more than 1 vehicle; array of key, value
        for (var n = 0; n < vehicles.length; n++) {
            vehiclesString += "</tr><td>" + vehicles[n].Division + "</td><td>" + vehicles[n].Station + "</td><td>" + vehicles[n].VehicleID + "</td>"
            vehiclesArr.push( {division: vehicles[n].Division, station: vehicles[n].Station, vehicleID: vehicles[n].VehicleID} )
        }
    }
    vehiclesString += "</table>"
    fnCallback(vehiclesString);
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// read in url parameters and parse into an object; any error return empty object
function getUrlParameterOptions(url, fnCallback) {

    try {
        var paramsArr = url.split("&")
        var myObject = {}

        for (var counter = 0; counter < paramsArr.length; counter++) {
            var params  = paramsArr[counter].split("=");
            var myKey   = params[0]
            var myValue = params[1];

            myObject[myKey]  = myValue;
        }
        fnCallback(myObject);
    } catch (error) {
        fnCallback({});
    }
};
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// read and set url parameters to variables
function processParams(params) {

    if (params['recent'] && params['recent'] > 0 && params['recent'] <= 20) { gnRecentMarkersToDisplay = params['recent'] } 
    else { gnRecentMarkersToDisplay = CONST_YELLOW_MARKER_MAX_COUNT }

    if (params['zoomTo']) { gbZoomTo = eval(params['zoomTo']) } 
    else { gbZoomTo = CONST_MAP_AUTOZOOM_TO_INCIDENT }

    if (params['filter']) { gSearchText = params['filter'].replace("%20", " ").split("&")[0].split(",") } 
    else { gSearchText = null }

    if (params['baseLayer'] && params['baseLayer'] >=0 && params['baseLayer'] <= 4) { gnBaseLayer = params['baseLayer'].replace("%20", " ").split("&")[0].split(",") } 
    else { gnBaseLayer = 0 }
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates controls found in the lower right of the app
// this is a text control with text info on a given incident
function createIncidentTextControl(map, info, marker, bHighlight, title, textCustomControlArr) {
     
    var latlng = marker._latlng
    var leafletID = marker._leaflet_id

    var textCustomControl = L.Control.extend({
        options: {
            position: 'bottomright' 
        },

        onAdd: function() {
            var myMarker = marker;
            var container = L.DomUtil.create('div', 'custom-control cursor-pointer leaflet-bar', L.DomUtil.get('map'));
           
            if (bHighlight) { 
                container.style.backgroundColor = "#dbe7ea"
                // L.DomUtil.addClass(map._container, 'hightlight-background')
                container.innerHTML             = "<center><span id='hightlight-text'>" + info + "</span></center>"
            } else {
                container.style.backgroundColor = "#f9f9eb"
                // L.DomUtil.addClass(map._container, 'normal-background')
                container.innerHTML             = "<center><span id='normal-text'>" + info + "</span></center>"
            }

            // add tooltip
            if (title) container.title = title

            container.onclick = function() { 
                
                // console.log(leafletID)
                // console.log(map._layers[leafletID]._events.click[0].fn)
                // map._layers[leafletID].openPopup();
                
                map.flyTo(latlng, CONST_MAP_INCIDENT_ZOOM) 
            }
            container.onmouseover = function() { L.DomUtil.addClass(map._container,'cursor-pointer') }
            container.onmouseout  = function() { L.DomUtil.removeClass(map._container,'cursor-pointer') }

            return container;
        },
        
        onRemove: function(map) { }

    });
    var myControl = new textCustomControl();
    textCustomControlArr.push(myControl)
    map.addControl(myControl);
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates a text control on the map that lists filter keywords
function createFilterTextControl(map, filterTextControl) {

    var filterCustomControl = L.Control.extend({
        options: {
            position: 'bottomright' 
        },

        onAdd: function(map) {
            var container       = L.DomUtil.create('div', 'filter-control leaflet-bar', L.DomUtil.get('map'));
            var text            = gSearchText.toString()
            container.innerHTML = "<center>Filter Keyword(s): " + text + "</center>"
            return container;
        },

    });
    filterTextControl = new filterCustomControl();
    map.addControl(filterTextControl);

    return filterTextControl;
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates Help control (question mark at upper right of map)
function createHelpControl(map) {
     
    var helpControl = L.Control.extend({
        options: {
            position: 'topright' 
        },

        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'button-custom help-icon cursor-pointer leaflet-bar', L.DomUtil.get('map'));
            container.title = "Click for Help"
            container.onclick = function() { window.open(CONST_HELP_PAGE) }   // webpage to open when clicked
            return container;
        },

    });
    var myControl = new helpControl();
    map.addControl(myControl);
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates Help control (question mark at upper right of map)
function createCityGramControl(map) {
     
    var cityGramControl = L.Control.extend({
        options: {
            position: 'topright' 
        },

        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'button-custom citygram-icon cursor-pointer leaflet-bar leaflet-control-custom', L.DomUtil.get('map'));
            container.title = "Citygram - Tulsa"
            container.onclick = function() { window.open(CONST_CITYGRAM_PAGE) }   // webpage to open when clicked
            return container;
        },

    });
    var myControl = new cityGramControl();
    map.addControl(myControl);
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// check if any of the url parameter 'filter' keywords are found in the incdent's 'Problem' text/description
function foundInSearchText(txtProblem) {

    var bReturn = false;
    if (gSearchText) {
        for (var n = 0; n < gSearchText.length; n++) {
            if (txtProblem.toLowerCase().indexOf(gSearchText[n].toLowerCase()) > -1) {
                bReturn = true
                break;
            }
        }
    }
    return bReturn;
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function moveMarker(fromMarkers, toMarkers, markerColor, classToRemove, classToAdd) {

    // remove oldest marker from fromMarkers and add it to toMarkers
    var marker = fromMarkers[0]
    L.DomUtil.removeClass(marker._icon, classToRemove);

    marker.setIcon(markerColor);

    if (classToAdd) { 
        // per Internet ==> this is a workaround; setting "blink" in the L.marker statement offsets the marker and popup
        function blink() { L.DomUtil.addClass(marker._icon, classToAdd) }
        blink();
    }
    
    toMarkers.push(marker)
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function fifoMarkers(newestMarkers, recentMarkers, olderMarkers) {

    // as necessary shift out marker from newestMarkers[] and push to recentMarkers[]
    while (newestMarkers.length > CONST_RED_MARKER_MAX_COUNT) {
        // move red marker to recentMarkers
        moveMarker(newestMarkers, recentMarkers, CONST_MARKER_YELLOW, "blink", "blinkSlower")
        newestMarkers.shift()
    }

    // as necessary shift out marker from recentMarkers[] and push to olderMarkers[]
    while (recentMarkers.length > gnRecentMarkersToDisplay) {
        moveMarker(recentMarkers, olderMarkers, CONST_MARKER_BLUE, "blinkSlower")
        recentMarkers.shift()
    }
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function createRedMarker(incident) {

    var marker;
    var vehicles  = incident.Vehicles.Vehicle
    
    buildVehicleHTMLString(vehicles, function(vehiclesString) {
        markerPopupString = "<center><p style='color:red;'>" + incident.Problem + "</p>Address: " + incident.Address + "</br></br>Response Date: " +            
                            incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"
        
        marker = new L.marker([incident.Latitude, incident.Longitude], {title: incident.Problem + " - " + incident.Address + " - " + incident.ResponseDate.split(" ")[1] + incident.ResponseDate.split(" ")[2], riseOnHover: true});
        marker.bindPopup(markerPopupString);

    })
    marker.setIcon(CONST_MARKER_RED)
    return marker;
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function processNewIncident(map, incident, newestMarkers, recentMarkers, olderMarkers) {

    var marker = createRedMarker(incident); 
    newestMarkers.push(marker)
    marker.addTo(map);

    // per Internet ==> this is a workaround; setting "blink" in the L.marker statement offsets the marker and popup
    function blink() { L.DomUtil.addClass(marker._icon, "blink"); }
    blink();

    fifoMarkers(newestMarkers, recentMarkers, olderMarkers)
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// url param variables
var gnRecentMarkersToDisplay
var gbZoomTo
var gSearchText = null
var gnBaseLayer

var gmapLayers  = [];
var gbaseMaps   = {};
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// build map layers (dynamically) from CONST_MAP_LAYERS
for (n = 0; n < CONST_MAP_LAYERS.length; n++) {
    gmapLayers[n] = L.tileLayer(CONST_MAP_LAYERS[n].url, { 
        attribution: CONST_MAP_LAYERS[n].attribution, 
        minZoon: CONST_MAP_LAYERS[n].minZoom, 
        maxZoom: CONST_MAP_LAYERS[n].maxZoom 
    })
    gbaseMaps[[CONST_MAP_LAYERS[n].name]] = gmapLayers[n];
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// here we go
$(document).ready(function() {

    var textCustomControlArr = []
    var filterTextControl    = null

    var allIncidentNumbers   = []
    var newestMarkers        = []
    var recentMarkers        = []
    var olderMarkers         = []
    var lastGoodIncident     = null;


    // read in and process url parameters
    var params = getUrlParameterOptions(window.location.search.slice(1), function(params) {
        if (params !== {}) processParams(params)
    });

    // define map position, zoom and baselayer
    var map = L.map('map', {
        center: [ CONST_MAP_DEFAULT_LATITUDEY, CONST_MAP_DEFAULT_LONGITUDEX ],
        zoom: CONST_MAP_DEFAULT_ZOOM,
        layers: [gmapLayers[gnBaseLayer]]
    });


    ///////////////////////////////////////
    L.control.layers(gbaseMaps).addTo(map)   // add all map layers to layer control
    L.control.scale({imperial: true, metric: false}).addTo(map) // add scalebar
    createHelpControl(map);
    createCityGramControl(map);
    ///////////////////////////////////////


    ///////////////////////////////////////
    function getTfdData() {

        $.ajax({ type: "GET", url: CONST_MAP_JSON_URL }).done(function(response){

            // check if we have seen this incident number before
            if (allIncidentNumbers.indexOf(response.Incidents.Incident[0].IncidentNumber) == -1) {      

                updateIndexedDB(response);                       // json file has updated

                var incidents      = response.Incidents          // all json incidents
                var incidentsCount = incidents.Incident.length;  // number of json incidents

                // iterate through all of the JSON incidents backwards, oldest incident first
                for (var counter = incidentsCount - 1; counter >= 0; counter--) {

                    var incident = incidents.Incident[counter]  // fetch incident

                    // check if the incident number is in the array; if not it is a never before seen incident
                    if (allIncidentNumbers.indexOf(incident.IncidentNumber) == -1) {     
                        
                        allIncidentNumbers.push(incident.IncidentNumber)

                        // check if given incident 'Problem' text meets filtering requirements
                        var bFound = false
                        if (gSearchText) { bFound = foundInSearchText(incident.Problem) }  

                        // if filter requirement is met OR there is no filter to apply
                        if (bFound || gSearchText == null) {   
                            processNewIncident(map, incident, newestMarkers, recentMarkers, olderMarkers)
                            lastGoodIncident = incident
                        }
                    }
                }

                while (textCustomControlArr.length > 0) {  // clear map of bottom right text controls
                    map.removeControl(textCustomControlArr[0])
                    textCustomControlArr.shift(0, 1);
                }

                // create text controls for recentMarkers (lower right controls)
                for (var counter = 0;  counter < gnRecentMarkersToDisplay; counter++) {
                    if (recentMarkers[counter]) {
                        
                        // add a tooltip for the first and last recentMarkers[]
                        var toolTip = null
                        switch(counter) {
                            case 0:                             toolTip = "oldest recent incident";   break;
                            case (recentMarkers.length - 1):    toolTip = "newest recent incident";   break;
                        }
                        createIncidentTextControl(map, recentMarkers[counter].options.title, recentMarkers[counter], false, toolTip, textCustomControlArr)
                    }
                }

                if (lastGoodIncident) {
                    createIncidentTextControl(map, 
                                              newestMarkers[newestMarkers.length - 1].options['title'],
                                              newestMarkers[newestMarkers.length - 1], 
                                              true, 
                                              "Current Incident",
                                              textCustomControlArr)
                    newestMarkers[newestMarkers.length - 1].openPopup()
                    if (gbZoomTo) { map.flyTo(newestMarkers[newestMarkers.length - 1]._latlng, CONST_MAP_INCIDENT_ZOOM) }
                }

                // create text control for filter keyword(s)
                if (gSearchText !== null) {         
                    if (filterTextControl) map.removeControl(filterTextControl)
                    filterTextControl = createFilterTextControl(map, filterTextControl)
                }

            }
         })
        setTimeout(getTfdData, CONST_JSON_UPDATE_TIME);
    }
    getTfdData();
})

