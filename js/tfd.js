//////////////////////////////////////////////////////////////////////
const CONST_MAP_DEFAULT_LONGITUDEX    = -95.992775
const CONST_MAP_DEFAULT_LATITUDEY     =  36.1539816
const CONST_MAP_DEFAULT_ZOOM          =  11

const CONST_MAP_JSON_URL              = "https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn"
const CONST_JSON_UPDATE_TIME          = 6000    // how often to poll for JSON data from server

const CONST_MAP_INCIDENT_ZOOM         = 15
const CONST_MAP_AUTOZOOM_TO_INCIDENT  = true

const CONST_NUM_RECENT_MARKERS_TO_DISPLAY = 5   // number of yellow markers to display

const CONST_PIN_ANCHOR           = new L.Point(25/2, 41);
const CONST_MARKER_COLOR_RED     = "./images/marker-icon-red.png";
const CONST_MARKER_COLOR_YELLOW  = "./images/marker-icon-yellow.png"

const CONST_MARKER_RED           = new L.Icon({ iconUrl: CONST_MARKER_COLOR_RED,    iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });
const CONST_MARKER_YELLOW        = new L.Icon({ iconUrl: CONST_MARKER_COLOR_YELLOW, iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });


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
    }
    return vehicles;
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
function clearCurrentMarker(marker) {    // make the red marker blue
    marker.closePopup();
    L.DomUtil.removeClass(marker._icon, "blink");
    marker.setIcon(new L.Icon.Default());
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
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
// make the marker red and flashing
function processCurrentIncident(map, currentMarker, incident) {
    currentMarker.setIcon(CONST_MARKER_RED)
    currentMarker.openPopup();
    if (eval(gbZoomTo) ) { map.flyTo([incident.Latitude, incident.Longitude], CONST_MAP_INCIDENT_ZOOM); }
    // this is a workaround; setting "blink" in the L.marker statement offsets the marker and popup
    function blink() { L.DomUtil.addClass(currentMarker._icon, "blink"); }
    blink();
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// make the markers yellow and flashing
function processRecentIncidents(recentMarkers) {

    for (var counter = 0; counter < recentMarkers.length; counter++) {
        recentMarkers[counter].setIcon(CONST_MARKER_YELLOW)
        function blinkSlower() { L.DomUtil.addClass(recentMarkers[counter]._icon, "blinkSlower"); }
        blinkSlower();
    }

    var counter = 0
    while (recentMarkers.length > gnRecentMarkersToDisplay) {
        L.DomUtil.removeClass(recentMarkers[counter]._icon, "blinkSlower");
        recentMarkers[counter].setIcon(new L.Icon.Default());
        recentMarkers.shift();
        counter++
    }
    return recentMarkers;
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function processRecentInfo(map, info, latlng, bHighlight, title) {
     
    var textCustomControl = L.Control.extend({
        options: {
            position: 'bottomright' 
        },

        onAdd: function(map, myMarker) {
            var container = L.DomUtil.create('div', 'custom-control cursor-pointer leaflet-bar leaflet-control-custom', L.DomUtil.get('map'));
           
            if (bHighlight) { 
                container.style.backgroundColor = "#dbe7ea"
                container.innerHTML             = "<center><font color='red'>" + info + "</font></center>"
            } else {
                container.style.backgroundColor = "#f9f9eb"
                container.innerHTML             = "<center>" + info + "</center>"
            }
            if (title) container.title = title

            container.onclick     = function() { map.flyTo(latlng, CONST_MAP_INCIDENT_ZOOM) }
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


var gtextCustomControlArr = []
var gnRecentMarkersToDisplay
var gbZoomTo


//////////////////////////////////////////////////////////////////////
// here we go
$(document).ready(function() {

    // /////////////////////////////////////
    // read in and set url parameters
    var params = getUrlParameterOptions(window.location.search.slice(1), function(params) {
        if (params['recent'] && params['recent'] > 0 && params['recent'] <= 20) { gnRecentMarkersToDisplay = params['recent'] } 
        else { gnRecentMarkersToDisplay = CONST_NUM_RECENT_MARKERS_TO_DISPLAY }

        if (params['zoomTo']) { gbZoomTo = params['zoomTo'] } 
        else { gbZoomTo = CONST_MAP_AUTOZOOM_TO_INCIDENT }
    });
    // /////////////////////////////////////

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

            // if the following is true, a new incident has occurred (json file has updated)
            if (currentIncidentNumber !== latestIncidentNumber) {

                if (currentMarker) { 
                    clearCurrentMarker(currentMarker)   // turn red marker into blue marker
                    recentMarkers.push(currentMarker) 
                }
                
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
                            
                            marker = new L.marker([incident.Latitude, incident.Longitude], {title: incident.Problem + " - " + incident.Address + " - " + incident.ResponseDate.split(" ")[1] + incident.ResponseDate.split(" ")[2], riseOnHover: true}).addTo(map);
                            marker.bindPopup(popupString);

                            if (counter > 0 && (counter <= gnRecentMarkersToDisplay)) {
                                // new recent marker
                                recentMarkers.push(marker)
                            }
                        })
                    } 
                }
                recentMarkers = processRecentIncidents(recentMarkers)

                // store the newest incident 
                currentIncidentNumber   = latestIncidentNumber;        
                currentMarker           = marker
                processCurrentIncident(map, currentMarker, incident)     // make current incident marker red and blink and pan/zoom to marker

                while (gtextCustomControlArr.length > 0) {               // clear bottom right controls
                    map.removeControl(gtextCustomControlArr[0])
                    gtextCustomControlArr.shift(0, 1);
                }

                // process the recent incidents (yellow markers)
                for (var counter = 0; counter < gnRecentMarkersToDisplay; counter++) {
                    var msg         = recentMarkers[counter].options.title
                    var myMarker    = recentMarkers[counter]
                    var toolTip     = null
                    
                    var nValue = gnRecentMarkersToDisplay - 1
                    switch(counter) {
                        case 0:         toolTip = "oldest recent incident";   break;
                        case nValue:    toolTip = "newest recent incident";   break;
                    }
                    processRecentInfo(map, msg, myMarker._latlng, false, toolTip)
                }
                // process the most current incident (red marker)
                processRecentInfo(map, incident.Problem + " - " + incident.Address + " - " + incident.ResponseDate.split(" ")[1] + incident.ResponseDate.split(" ")[2], [incident.Latitude, incident.Longitude], true, "Current Incident")
            }
        })
        setTimeout(getTfdData, CONST_JSON_UPDATE_TIME);
    }
    getTfdData();
})

