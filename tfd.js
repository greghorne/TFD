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

        // iterate through json
        for (var n = 0; n < incidentsCount; n++) {

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

const CONST_RECENT_MARKERS_TO_DISPLAY = 3

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

    // add all map layers to layer control
    L.control.layers(baseMaps).addTo(map)

    // add scalebar
    L.control.scale({imperial: true, metric: false}).addTo(map)

    // /////////////////////////////////////
    function getTfdData() {
        $.ajax({ type: "GET", url: url }).done(function(response){

            updateIndexedDB(response);

            // all json incidents
            var incidents       = response.Incidents

            // number of json incidents
            var incidentsCount  = incidents.Incident.length;

            // most recent incident from the json object
            var latestIncidentNumber    = incidents.Incident[0].IncidentNumber

            if (currentIncidentNumber !== latestIncidentNumber) {

                // if true, then the currentMarker is the the blinking marker on the map
                // which needs to quit blinking in that we are processing a newer marker
                if (currentMarker) {
                    currentMarker.closePopup();
                    L.DomUtil.removeClass(currentMarker._icon, "blinking");
                }

                if (recentMarkers.length > 0) {
                    for (var n = 0; n < CONST_RECENT_MARKERS_TO_DISPLAY; n++) {
                        var aMarker = recentMarkers[n]
                        L.DomUtil.removeClass(recentMarkers[n]._icon, "blinking2");
                    }
                    recentMarkers = []
                }

                // iterate through all of the JSON incidents
                // for (var counter = 0; counter < incidentsCount; counter++) {
                for (var counter = incidentsCount - 1; counter >= 0; counter--) {

                    // fetch incident
                    var incident = incidents.Incident[counter]

                    // see if the incidentNumber is in an array
                    // in not in array then we need to add a marker to the map
                    if (markers.indexOf(incident.IncidentNumber) == -1) {

                        //////////////////////////////////////////////////////////////////////
                        // build vehicle(s) html string for popup
                        //////////////////////////////////////////////////////////////////////
                        var vehiclesArr = [];
                        var vehicles  = incident.Vehicles.Vehicle
                        var vehiclesString = "<table></br>Responding Vehicle(s):</br>"

                        // if there is more than one vehicle responding then it is in an array
                        if (vehicles.Division) {
                            vehiclesString += "</tr><td>" + vehicles.Division + "</td><td>" + vehicles.Station + "</td><td>" + vehicles.VehicleID + "</td>"
                            vehiclesArr.push( {division: vehicles.Division, station: vehicles.Station, vehicleID: vehicles.VehicleID} )
                        } else {
                            for (var n = 0; n < vehicles.length; n++) {
                                vehiclesString += "</tr><td>" + vehicles[n].Division + "</td><td>" + vehicles[n].Station + "</td><td>" + vehicles[n].VehicleID + "</td>"
                                vehiclesArr.push( {division: vehicles[n].Division, station: vehicles[n].Station, vehicleID: vehicles[n].VehicleID} )
                            }
                        }
                        vehiclesString += "</table>"
                        //////////////////////////////////////////////////////////////////////

                        // create new map marker

                        var markerPos = new L.LatLng(incident.Latitude, incident.Longitude);
                        var pinAnchor = new L.Point(25/2, 41);
                        var pin = new L.Icon({ iconUrl: "marker-icon-red.png", iconsize: [25, 41], iconAnchor: pinAnchor, popupAnchor: [0,-41], title: incident.Problem, riseOnHover: true });
                        marker = new L.marker(markerPos, { icon: pin }).addTo(map);

                        // var icon = L.icon({iconUrl: "marker-icon-red.png"})
                        // marker = new L.marker([incident.Latitude, incident.Longitude], {icon: icon, title: incident.Problem, riseOnHover: true}).addTo(map);

                        popupString = "<center><p style='color:red;'>" + incident.Problem + "</p>Address: " + incident.Address + "</br></br>Response Date: " + incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"

                        // add incident number to array; array contains incident number for all markers that have been created
                        markers.push(incident.IncidentNumber)

                        if (counter === 0) {

                            // special handling for the latest JSON incident (the newest incident)
                            
                            currentIncidentNumber = incident.IncidentNumber;

                            currentMarker = marker
                            marker.bindPopup(popupString).openPopup();

                            // flyTo seems to hang when the window is no in focus
                            if ($(window).focus) {
                                map.flyTo([incident.Latitude, incident.Longitude], CONST_MAP_INCIDENT_ZOOM);
                            } else {
                                // pan and zoom to incident
                                map.panTo([incident.Latitude, incident.Longitude]);
                                map.setZoom(CONST_MAP_INCIDENT_ZOOM)
                            }
                           
                            // this is a workaround; setting "blinking" in the L.marker statement offsets the marker and popup
                            function blink() {
                                L.DomUtil.addClass(marker._icon, "blinking");
                            }
                            blink();
                        } else if (counter > 0 && counter <= CONST_RECENT_MARKERS_TO_DISPLAY) {
                            
                            // this is not the latest incident so just bind the popup to the marker
                            marker.bindPopup(popupString);

                            recentMarkers.push(marker);
                           
                            // this is a workaround; setting "blinking" in the L.marker statement offsets the marker and popup
                            function blink() {
                                L.DomUtil.addClass(marker._icon, "blinking2");
                            }
                            blink();

                        } else {
                            // this is not the latest incident so just bind the popup to the marker
                            marker.bindPopup(popupString);
                        }
                        
                    }
                }
            }
        })

        // poll json data
        setTimeout(getTfdData, 60000);
    }
    getTfdData();
})

