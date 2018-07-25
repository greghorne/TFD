// prepare indexedDB 
var deleteIndexedDB = window.indexedDB.deleteDatabase("TFDIncidents")
var indexedDB       = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

// prefixes of window.IDB objects
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange    = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
 
function getVehicles(vehicles) {

    var vehiclesArr = [];

    // for a given incident, there may be one or more responding vehicles
    // if vehicles = 1; then it is a key, value pair
    // if vehicles > 1; then it is in any array of key, value pairs
    // this function returns an array of key, value pairs regardless

    if (vehicles.Division) {
        vehiclesArr.push( {division: vehicles.Division, station: vehicles.Station, vehicleID: vehicles.VehicleID} )
        return vehiclesArr
    } else {
        return vehicles;
    }

}


function updateIndexedDB(json) {
    
    var db = indexedDB.open("TFDIncidents", 1);
    var json = JSON.parse(json)

    db.onupgradeneeded = function() {
        var database    = db.result;
        var store = database.createObjectStore("IncidentsStore", {keyPath: "incidentNumber", unique: true});
    }

    db.onsuccess = function() {

        var database = db.result
        var tx       = database.transaction(["IncidentsStore"], "readwrite");
        var store    = tx.objectStore("IncidentsStore");

        var incidentsCount = json.Incidents.Incident.length;

        console.log("json length: " + json.Incidents.Incident.length)

        // iterate through json
        for (var n = 0; n < incidentsCount; n++) {

            // individual incident
            var incident = json.Incidents.Incident[n];

            console.log(incident.IncidentNumber)

            // for storing vehicle(s)
            var vehiclesArr = [];
            var vehicles    = incident.Vehicles
            vehiclesArr     = getVehicles(vehicles);

            store.add({ incidentNumber: incident.IncidentNumber, problem: incident.Problem, address: incident.Address, date: incident.ResponseDate, lat: incident.Latitude, lng: incident.Longitude, vehicles: vehiclesArr })
            store.onerror = function(event) {
                console.log("store.add error...")
                console.log(event);
            }
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

const CONST_MAP_INCIDENT_ZOOM      = 15

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

$(document).ready(function() {

    var map;

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

    var myIcon = L.icon({ className: 'blinnking'})
    // var marker = new L.marker([0,0]).addTo(map);
    var marker;
    var url = CONST_MAP_JSON_URL;
    var currentIncidentNumber = "";

    function getTfdData() {
        $.ajax({ type: "GET", url: url }).done(function(response){
            
            // determine if the latest incident we have is the same as the latest json incident
            var incident = response.Incidents.Incident[0]
            if (currentIncidentNumber == incident.IncidentNumber) {
                return;
            } else {
                currentIncidentNumber = incident.IncidentNumber;
                updateIndexedDB(JSON.stringify(response));
            } 
            
            //////////////////////////////////////////////////////////////////////
            var vehiclesArr = [];
            var vehicles  = incident.Vehicles.Vehicle
            var vehiclesString = "<table></br>Responding Vehicle(s):</br>"

            // if there is more than one vehicle responding then it is in an array
            if (vehicles.Division) {
                vehiclesString += "</tr><td>" + vehicles.Division + "</td><td>" + vehicles.Station + "</td><td>" + vehicles.VehicleID + "</td>"
                vehiclesArr.push( {division: vehicles.Division, station: vehicles.Station, vehicleID: vehicles.VehicleID} )
            } else {
                for (n = 0; n < vehicles.length; n++) {
                    vehiclesString += "</tr><td>" + vehicles[n].Division + "</td><td>" + vehicles[n].Station + "</td><td>" + vehicles[n].VehicleID + "</td>"
                    vehiclesArr.push( {division: vehicles[n].Division, station: vehicles[n].Station, vehicleID: vehicles[n].VehicleID} )
                }
            }
            vehiclesString += "</table>"
            //////////////////////////////////////////////////////////////////////

            if (marker) {
                marker.closePopup();
                L.DomUtil.removeClass(marker._icon, "blinking");
                marker.onmouseover = function() { marker.openPopup();}
                marker.onmouseout  = function() { marker.closePopup();}
            }

            if ($(window).focus) {
                map.flyTo([incident.Latitude, incident.Longitude], CONST_MAP_INCIDENT_ZOOM)
            } else {
                map.setZoom(CONST_MAP_INCIDENT_ZOOM);
                map.panTo([incident.Latitude, incident.Longitude]);
            }

            marker = new L.marker([incident.Latitude, incident.Longitude], {title: incident.Problem, riseOnHover: true}).addTo(map);
            popupString = "<center><p style='color:red;'>" + incident.Problem + "</p>Address: " + incident.Address + "</br></br>Response Date: " + incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"
            marker.bindPopup(popupString).openPopup();
            
            // this is a workaround; setting "blinking" in the L.marker statement offsets the marker and popup
            function blink() {
                L.DomUtil.addClass(marker._icon, "blinking");
            }
            blink();
        })
        setTimeout(getTfdData, 60000);
    }

    getTfdData();
})