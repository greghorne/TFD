//////////////////////////////////////////////////////////////////////
const CONST_MAP_DEFAULT_LONGITUDEX    = -95.992775
const CONST_MAP_DEFAULT_LATITUDEY     =  36.1539816
const CONST_MAP_DEFAULT_ZOOM          =  11

const CONST_MAP_JSON_URL              = "https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn"
const CONST_JSON_UPDATE               = 60000    // how often to poll for JSON data from server

const CONST_MAP_INCIDENT_ZOOM         = 15
const CONST_MAP_AUTOZOOM_TO_INCIDENT  = true

const CONST_NUM_RECENT_MARKERS_TO_DISPLAY = 5   // number of yellow markers to display

const CONST_PIN_ANCHOR           = new L.Point(25/2, 41);
const CONST_MARKER_COLOR_RED     = "./images/marker-icon-red.png";
const CONST_MARKER_COLOR_YELLOW  = "./images/marker-icon-yellow.png"

const CONST_MARKER_RED           = new L.Icon({ iconUrl: CONST_MARKER_COLOR_RED,    iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });
const CONST_MARKER_YELLOW        = new L.Icon({ iconUrl: CONST_MARKER_COLOR_YELLOW, iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });


// defintion of map layers; first layer is the default layer displayed
const CONST_MAP_LAYERS = [
    {
        name: "Grayscale",
        url: "http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png",
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        minZoom:  5,
        maxZoom: 17
    },
    {
        name: "OSM",
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
        var store = database.createObjectStore("Incidents", {keyPath: "incidentNumber", unique: true});
    }

    db.onsuccess = function() {
        var database = db.result
        var tx       = database.transaction(["Incidents"], "readwrite");
        var store    = tx.objectStore("Incidents");

        var incidentsCount = json.Incidents.Incident.length;

        for (var n = 0; n < incidentsCount; n++) {  // iterate through json
            var incident = json.Incidents.Incident[n];
            var vehiclesArr = getVehicles(incident.Vehicles);
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
function getVehicles(vehicles) {

    var vehiclesArr = [];

    // if vehicles = 1; then it is a key, value pair
    // if vehicles > 1; then it is in any array of key, value pairs
    if (vehicles.Division) {
        vehiclesArr.push( {division: vehicles.Division, station: vehicles.Station, vehicleID: vehicles.VehicleID} )
        return vehiclesArr;
    } else {
        return vehicles;
    }
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function buildVehicleHTMLString(vehicles, fnCallback) {

    // build vehicle(s) html string for popup
    var vehiclesArr = [];
    var vehiclesString = "<table></br>Responding Vehicle(s):</br>"

    if (vehicles.Division) {
        // only 1 vehicle responding; key, value
        vehiclesString += "</tr><td>" + vehicles.Division + "</td><td>" + vehicles.Station + "</td><td>" + vehicles.VehicleID + "</td>"
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
function clearCurrentMarker(currentMarker) {    // make the red marker blue
    currentMarker.closePopup();
    L.DomUtil.removeClass(currentMarker._icon, "blinking");
    currentMarker.setIcon(new L.Icon.Default());
    return "";
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function clearRecentMarkers(recentMarkers) {    // make the yellow marker(s) blue
    // set it back to default icon (blue)
    for (var n = 0; n < gnRecentMarkersToDisplay; n++) {
        var aMarker = recentMarkers[n]
        L.DomUtil.removeClass(aMarker._icon, "blinking2");
        recentMarkers[n].setIcon(new L.Icon.Default());
    }
    return [];
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function getUrlParameterOptions(url) {

    // read in url parameters (recent and zoomTo)
    try {
        var paramsArr = url.split("&")
        var myObject = {}

        for (var counter = 0; counter < paramsArr.length; counter++) {
            var params  = paramsArr[counter].split("=");
            var myKey   = params[0]
            var myValue = params[1];

            myObject[myKey]  = myValue;
        }
        return myObject;
    } catch (error) {
        return {}
    }
};
//////////////////////////////////////////////////////////////////////


var gnRecentMarkersToDisplay
var gbZoomTo


//////////////////////////////////////////////////////////////////////
// here we go
$(document).ready(function() {

    // read in and set url parameters
    var params = getUrlParameterOptions(window.location.search.slice(1));
    if (params['recent']) { gnRecentMarkersToDisplay = params['recent'] } 
    else { gnRecentMarkersToDisplay = CONST_NUM_RECENT_MARKERS_TO_DISPLAY }

    if (params['zoomTo']) { gbZoomTo = Boolean(params['zoomTo']) } 
    else { gbZoomTo = CONST_MAP_AUTOZOOM_TO_INCIDENT }
    console.log("gnRecentMarkersToDisplay: " + gnRecentMarkersToDisplay)
    console.log("gbZoomTo: " + gbZoomTo)
    
    var marker;
    var markers = [];
    var currentMarker;
    var recentMarkers = [];
    var currentIncidentNumber = "";

    // define map position, zoom and layer
    var map = L.map('map', {
        center: [ CONST_MAP_DEFAULT_LATITUDEY, CONST_MAP_DEFAULT_LONGITUDEX ],
        zoom: CONST_MAP_DEFAULT_ZOOM,
        layers: [mapLayers[0]]
    });

    L.control.layers(baseMaps).addTo(map)   // add all map layers to layer control
    L.control.scale({imperial: true, metric: false}).addTo(map) // add scalebar

    // /////////////////////////////////////
    function getTfdData() {

        $.ajax({ type: "GET", url: CONST_MAP_JSON_URL }).done(function(response){

            updateIndexedDB(response);

            var incidents               = response.Incidents                    // all json incidents
            var incidentsCount          = incidents.Incident.length;            // number of json incidents
            var latestIncidentNumber    = incidents.Incident[0].IncidentNumber  // most recent incident from the json object

            // if the following is true, a new incident has occurred that also means the json file has changed (updated)
            if (currentIncidentNumber !== latestIncidentNumber) {

                // turn any red or yellow icons back to blue
                if (currentMarker)            { clearCurrentMarker(currentMarker) }
                if (recentMarkers.length > 0) { recentMarkers = clearRecentMarkers(recentMarkers) }
                
                // iterate through all of the JSON incidents backwards, oldest incident first
                for (var counter = incidentsCount - 1; counter >= 0; counter--) {
                    var incident = incidents.Incident[counter]  // fetch incident

                    // see if the incidentNumber is in an array, if not it is a new incident so add it to the array and add a blue marker
                    if (markers.indexOf(incident.IncidentNumber) == -1) {
                        markers.push(incident.IncidentNumber)   // add incident number to array; array contains incident number for all markers that have been created
                        var vehicles  = incident.Vehicles.Vehicle
                        buildVehicleHTMLString(vehicles, function(vehiclesString) {
                            popupString = "<center><p style='color:red;'>" + incident.Problem + "</p>Address: " + incident.Address + "</br></br>Response Date: " +            
                                                incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"
                            marker = new L.marker([incident.Latitude, incident.Longitude], {title: incident.Problem, riseOnHover: true}).addTo(map);
                            marker.bindPopup(popupString);
                        });
                    }
                
                    //////////////////////////////////////////////////////////////////////
                    // store the newest incident and recent incidents
                    if (counter == 0) {
                        currentIncidentNumber = incident.IncidentNumber;        // store the newest incident (to make into a red marker)
                        currentMarker = marker
                    } else if (counter > 0 && counter <= gnRecentMarkersToDisplay) {
                        recentMarkers.push(marker)                              // store inicdent(to make into a yellow marker)
                    }
                    //////////////////////////////////////////////////////////////////////
                }

                //////////////////////////////////////////////////////////////////////
                // change current incident marker to red
                currentMarker.setIcon(CONST_MARKER_RED)
                currentMarker.openPopup();
                if ($(window).focus && gbZoomTo) { 
                    map.flyTo([incident.Latitude, incident.Longitude], CONST_MAP_INCIDENT_ZOOM); 
                } else {
                    map.panTo([incident.Latitude, incident.Longitude]);
                    map.setZoom(CONST_MAP_INCIDENT_ZOOM)
                }
                // this is a workaround; setting "blinking" in the L.marker statement offsets the marker and popup
                function blink() { L.DomUtil.addClass(currentMarker._icon, "blinking"); }
                blink();
                //////////////////////////////////////////////////////////////////////

                //////////////////////////////////////////////////////////////////////
                // change "recent" markers to yellow
                for (var counter = 0; counter < recentMarkers.length; counter++) {
                    var myMarker = recentMarkers[counter];
                    myMarker.setIcon(CONST_MARKER_YELLOW)
                    function blink2() { L.DomUtil.addClass(myMarker._icon, "blinking2"); }
                    blink2();
                }
                //////////////////////////////////////////////////////////////////////
            }
        })

        // retrieve json data
        setTimeout(getTfdData, CONST_JSON_UPDATE);
    }
    getTfdData();
})

