//////////////////////////////////////////////////////////////////////
const CONST_MAP_DEFAULT_LONGITUDEX    = -95.992775
const CONST_MAP_DEFAULT_LATITUDEY     =  36.1539816
const CONST_MAP_DEFAULT_ZOOM          =  11

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

const CONST_GITHUB_PAGE          = "https://github.com/greghorne/TFD"

const CONST_RED_MARKER_MAX_COUNT    = 1
const CONST_YELLOW_MARKER_MAX_COUNT = 10

// definition of map layers; first layer is the default layer displayed
const CONST_MAP_LAYERS = [
    {
        name: "Grayscale",
        url: "http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png",
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        minZoom:  5,
        maxZoom: 17
    },
    {
        name: "Color",
        url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attirbution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
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
// build map layers (dynamically) from CONST_MAP_LAYERS
var mapLayers = [];
var baseMaps  = {};
for (n = 0; n < CONST_MAP_LAYERS.length; n++) {
    mapLayers[n] = L.tileLayer(CONST_MAP_LAYERS[n].url, { 
        attribution: CONST_MAP_LAYERS[n].attribution, 
        minZoon: CONST_MAP_LAYERS[n].minZoom, 
        maxZoom: CONST_MAP_LAYERS[n].maxZoom 
    })
    baseMaps[[CONST_MAP_LAYERS[n].name]] = mapLayers[n];
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// returns an array of vehicles 
function getVehicles(vehicles) {

    // if vehicles = 1; then it is a key, value pair object that needs to be put in an array
    // if vehicles > 1; then it is alread an array of key, value pairs so just return it

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
// read in url parameters and parse into an object; if this fails then return empty object
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
    
    // gnRecentMarkersToDisplay = CONST_YELLOW_MARKER_MAX_COUNT
    // gbZoomTo = CONST_MAP_AUTOZOOM_TO_INCIDENT
    // gSearchText = null

    if (params['recent'] && params['recent'] > 0 && params['recent'] <= 20) { gnRecentMarkersToDisplay = params['recent'] } 
    else { gnRecentMarkersToDisplay = CONST_YELLOW_MARKER_MAX_COUNT }

    if (params['zoomTo']) { gbZoomTo = params['zoomTo'] } 
    else { gbZoomTo = CONST_MAP_AUTOZOOM_TO_INCIDENT }

    if (params['filter']) { gSearchText = params['filter'].replace("%20", " ").split("&")[0].split(",") } 
    else { gSearchText = null }
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates controls found in the lower right of the app
// this is a text control with text info on a given incident
function createIncidentTextControl(map, info, marker, bHighlight, title) {
     
    var textCustomControl = L.Control.extend({
        options: {
            position: 'bottomright' 
        },

        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'custom-control cursor-pointer leaflet-bar leaflet-control-custom', L.DomUtil.get('map'));
           
            if (bHighlight) { 
                container.style.backgroundColor = "#dbe7ea"
                container.innerHTML             = "<center><font color='red'>" + info + "</font></center>"
            } else {
                container.style.backgroundColor = "#f9f9eb"
                container.innerHTML             = "<center>" + info + "</center>"
            }

            if (title) container.title = title

            container.onclick = function() { 
                console.log(marker)
                // marker._openPopup()
                map.flyTo(marker._latlng, CONST_MAP_INCIDENT_ZOOM) 
            }
            container.onmouseover = function() { L.DomUtil.addClass(map._container,'cursor-pointer') }
            container.onmouseout  = function() { L.DomUtil.removeClass(map._container,'cursor-pointer') }

            return container;
        },
        
        onRemove: function(map) { }

    });
    var myControl = new textCustomControl();
    gtextCustomControlArr.push(myControl)
    map.addControl(myControl);
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates a text control on the map that lists filter keywords
function createFilterTextControl(map) {

    var filterCustomControl = L.Control.extend({
        options: {
            position: 'bottomright' 
        },

        onAdd: function(map) {
            var container       = L.DomUtil.create('div', 'filter-control leaflet-bar leaflet-control-custom', L.DomUtil.get('map'));
            var text            = gSearchText.toString()
            container.innerHTML = "<center>Filter Keyword(s): " + text + "</center>"
            return container;
        },

    });
    gFilterTextControl = new filterCustomControl();
    map.addControl(gFilterTextControl);
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
            var container = L.DomUtil.create('div', 'button-help cursor-pointer leaflet-bar leaflet-control-custom', L.DomUtil.get('map'));
            container.title = "Click for Help"
            container.onclick = function() { window.open(CONST_GITHUB_PAGE) }
            return container;
        },

    });
    var myControl = new helpControl();
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

    // as necessary shift marker from newestMarkers[] and push to recentMarkers[]
    while (newestMarkers.length > CONST_RED_MARKER_MAX_COUNT) {
        // move red marker to recentMarkers
        moveMarker(newestMarkers, recentMarkers, CONST_MARKER_YELLOW, "blink", "blinkSlower")
        newestMarkers.shift()
    }

    // as necessary shift marker from recentMarkers[] and push to olderMarkers[]
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


var gtextCustomControlArr = []
var gnRecentMarkersToDisplay
var gbZoomTo
var gSearchText = null
var gFilterTextControl


//////////////////////////////////////////////////////////////////////
// here we go
$(document).ready(function() {

    var allIncidentNumbers  = []
    var newestMarkers       = []
    var recentMarkers       = []
    var olderMarkers        = []
    var lastGoodIncident    = null;


    // read in a process url parameters
    var params = getUrlParameterOptions(window.location.search.slice(1), function(params) {
        if (params !== {}) processParams(params)
    });


    // define map position, zoom and layer
    var map = L.map('map', {
        center: [ CONST_MAP_DEFAULT_LATITUDEY, CONST_MAP_DEFAULT_LONGITUDEX ],
        zoom: CONST_MAP_DEFAULT_ZOOM,
        layers: [mapLayers[0]]
    });


    ///////////////////////////////////////
    L.control.layers(baseMaps).addTo(map)   // add all map layers to layer control
    L.control.scale({imperial: true, metric: false}).addTo(map) // add scalebar
    createHelpControl(map);
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

                        // check if given incident 'Problem' text meets filter requirements
                        var bFound = false
                        if (gSearchText) { bFound = foundInSearchText(incident.Problem) }  

                        // if filter requirement is met OR there is no filter to apply
                        
                        if (bFound || gSearchText == null) {   
                            console.log("======") 
                            console.log(incident.Problem)
                            console.log(incident.IncidentNumber)
                            processNewIncident(map, incident, newestMarkers, recentMarkers, olderMarkers)
                            lastGoodIncident = incident
                        }
                    }
                }
                

                while (gtextCustomControlArr.length > 0) {  // clear map of bottom right text controls
                    map.removeControl(gtextCustomControlArr[0])
                    gtextCustomControlArr.shift(0, 1);
                    
                }

                // create text controls for recentMarkers (lower right controls)
                for (var counter = 0;  counter < CONST_YELLOW_MARKER_MAX_COUNT; counter++) {
                    
                    if (recentMarkers[counter]) {
                        var msg         = recentMarkers[counter].options.title
                        var myMarker    = recentMarkers[counter]
                        var toolTip     = null
                        
                        // add a tooltip for the first and last recentMarkers[]
                        var nMaxArrIndex = recentMarkers.length - 1
                        switch(counter) {
                            case 0:            toolTip = "oldest recent incident";   break;
                            case nMaxArrIndex: toolTip = "newest recent incident";   break;
                        }
                        createIncidentTextControl(map, msg, myMarker, false, toolTip)
                    }
                }

                // create text control for newestMarker
                if (lastGoodIncident) {
                    createIncidentTextControl(map, 
                                            lastGoodIncident.Problem + " - " + lastGoodIncident.Address + " - " + lastGoodIncident.ResponseDate.split(" ")[1] + lastGoodIncident.ResponseDate.split(" ")[2], 
                                            newestMarkers[counter], 
                                            true, 
                                            "Current Incident"
                    )
                }

                // create text control for filter keyword(s)
                if (gSearchText !== null) {         
                    if (gFilterTextControl) { map.removeControl(gFilterTextControl) }
                    createFilterTextControl(map)
                }

                newestMarkers[0].openPopup()
                map.flyTo(newestMarkers[0]._latlng, CONST_MAP_INCIDENT_ZOOM)
            }
         })
        setTimeout(getTfdData, CONST_JSON_UPDATE_TIME);
    }
    getTfdData();
})

