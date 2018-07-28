// prepare indexedDB 
var deleteIndexedDB = window.indexedDB.deleteDatabase("TFD")
var indexedDB       = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

// prefixes of window.IDB objects
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange    = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
 
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

// default map settings
const CONST_MAP_DEFAULT_LONGITUDEX = -95.992775
const CONST_MAP_DEFAULT_LATITUDEY  =  36.1539816
const CONST_MAP_DEFAULT_ZOOM       =  11

const CONST_MAP_JSON_URL = "https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn"

const CONST_MAP_INCIDENT_ZOOM         = 15

const CONST_RECENT_MARKERS_TO_DISPLAY = 5

const CONST_PIN_ANCHOR      = new L.Point(25/2, 41);
const CONST_MARKER_RED      = "./images/marker-icon-red.png";
const CONST_MARKER_YELLOW   = "./images/marker-icon-yellow.png"

const CONST_PIN_RED         = new L.Icon({ iconUrl: CONST_MARKER_RED, iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });
const CONST_PIN_YELLOW      = new L.Icon({ iconUrl: CONST_MARKER_YELLOW, iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });

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

function getVehicleHTMLString(vehicles, fn) {

    // build vehicle(s) html string for popup
    var vehiclesArr = [];
    var vehiclesString = "<table></br>Responding Vehicle(s):</br>"

    if (vehicles.Division) {
        // only 1 vehicle responding
        vehiclesString += "</tr><td>" + vehicles.Division + "</td><td>" + vehicles.Station + "</td><td>" + vehicles.VehicleID + "</td>"
        vehiclesArr.push( {division: vehicles.Division, station: vehicles.Station, vehicleID: vehicles.VehicleID} )
    } else {
        // more than 1 vehicle responding then it is in an array
        for (var n = 0; n < vehicles.length; n++) {
            vehiclesString += "</tr><td>" + vehicles[n].Division + "</td><td>" + vehicles[n].Station + "</td><td>" + vehicles[n].VehicleID + "</td>"
            vehiclesArr.push( {division: vehicles[n].Division, station: vehicles[n].Station, vehicleID: vehicles[n].VehicleID} )
        }
    }
    vehiclesString += "</table>"
    fn(vehiclesString);
}


// here we go
$(document).ready(function() {

    var map;
    // var myIcon = L.icon({ className: 'blinnking'})
    var marker;
    var markers = [];
    var currentMarker;
    var recentMarkers = [];
    var url = CONST_MAP_JSON_URL;
    var currentIncidentNumber = "";

    // define map position, zoom and layer
    map = L.map('map', {
        center: [ CONST_MAP_DEFAULT_LATITUDEY, CONST_MAP_DEFAULT_LONGITUDEX ],
        zoom: CONST_MAP_DEFAULT_ZOOM,
        layers: [mapLayers[0]]
    });

    L.control.layers(baseMaps).addTo(map)   // add all map layers to layer control
    L.control.scale({imperial: true, metric: false}).addTo(map) // add scalebar

    // /////////////////////////////////////
    function getTfdData() {
        $.ajax({ type: "GET", url: url }).done(function(response){

            updateIndexedDB(response);

            var incidents       = response.Incidents                            // all json incidents
            var incidentsCount  = incidents.Incident.length;                    // number of json incidents
            var latestIncidentNumber    = incidents.Incident[0].IncidentNumber  // most recent incident from the json object

            if (currentIncidentNumber !== latestIncidentNumber) {






                // if true, then the currentMarker is the the blinking marker on the map which needs to quit blinking in that we are processing a newer marker
                if (currentMarker) {
                    console.log("currentMarker...")
                    currentMarker.closePopup();
                    L.DomUtil.removeClass(currentMarker._icon, "blinking");
                    // currentMarker.setIcon({ icon: L.icon({}) }); ===> error
                    // currentMarkers[n].setIcon({icon: {}});        ===> error
                    // currentMarker.setIcon({ icon: L.Icon.Default() }); ==> error
                    currentMarker.setIcon(L.Icon.Default());
                    console.log("exit currentMarker...")
                }


                if (recentMarkers.length > 0) {
                    console.log("recentMarkers")
                    for (var n = 0; n < CONST_RECENT_MARKERS_TO_DISPLAY; n++) {
                        var aMarker = recentMarkers[n]
                        // L.DomUtil.removeClass(recentMarkers[n]._icon, "blinking2");
                        recentMarker[n].setIcon(L.Icon.Default());
                    }
                    recentMarkers = []
                }






                
                // iterate through all of the JSON incidents backwards, oldest incident first
                for (var counter = incidentsCount - 1; counter >= 0; counter--) {

                    var incident = incidents.Incident[counter]  // fetch incident
                    // see if the incidentNumber is in an array, if not then add it to the array and proceed to add a marker to the map
                    if (markers.indexOf(incident.IncidentNumber) == -1) {

                        var vehicles  = incident.Vehicles.Vehicle
                        var vehiclesString;
                        getVehicleHTMLString(vehicles, function(vehiclesString) {

                            popupString = "<center><p style='color:red;'>" + incident.Problem + "</p>Address: " + incident.Address + "</br></br>Response Date: " +            
                                        incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"
                            markers.push(incident.IncidentNumber)   // add incident number to array; array contains incident number for all markers that have been created

                            if (counter === 0) {
                                // special handling for the latest JSON incident (the newest incident)
                                var markerLocation = new L.LatLng(incident.Latitude, incident.Longitude);
                                marker             = new L.marker(markerLocation, { icon: CONST_PIN_RED, title: incident.Problem, riseOnHover: true }).addTo(map);
                                
                                currentIncidentNumber = incident.IncidentNumber;
                                currentMarker         = marker
                                marker.bindPopup(popupString).openPopup();

                                if ($(window).focus) {
                                    map.flyTo([incident.Latitude, incident.Longitude], CONST_MAP_INCIDENT_ZOOM);
                                } else {
                                    map.panTo([incident.Latitude, incident.Longitude]);
                                    map.setZoom(CONST_MAP_INCIDENT_ZOOM)
                                }
                            
                                // this is a workaround; setting "blinking" in the L.marker statement offsets the marker and popup
                                function blink() {
                                    L.DomUtil.addClass(marker._icon, "blinking");
                                }
                                blink();
                            } else if (counter > 0 && counter <= CONST_RECENT_MARKERS_TO_DISPLAY) {
                                var markerLocation = new L.LatLng(incident.Latitude, incident.Longitude);
                                marker             = new L.marker(markerLocation, { icon: CONST_PIN_YELLOW, title: incident.Problem, riseOnHover: true }).addTo(map);
                                marker.bindPopup(popupString);
                                recentMarkers.push(marker);
                            } else {
                                marker = new L.marker([incident.Latitude, incident.Longitude], {title: incident.Problem, riseOnHover: true}).addTo(map);
                                marker.bindPopup(popupString);
                            }
                        })
                        
                    }
                }
            }
        })

        // poll json data
        setTimeout(getTfdData, 60000);
    }
    getTfdData();
})

