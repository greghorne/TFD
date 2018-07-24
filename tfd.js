// prepare indexedDB 
var deleteIndexedDB = window.indexedDB.deleteDatabase("TFDIncidents")
var indexedDB       = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

// prefixes of window.IDB objects
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange    = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
 

// add location info to indexedDB
function addIncidentToindexedDB(incidentNumber, problem, address, responseDate, latitude, longitude, vehicles) {

    var openedDB = indexedDB.open("TFDIncidents", 1);

    openedDB.onupgradeneeded = function() {
        var db    = openedDB.result;
        var store = db.createObjectStore("IncidentsStore", {keyPath: "id", autoIncrement: true});
    }

    openedDB.onsuccess = function() {
        var database = openedDB.result
        var tx    = database.transaction(["IncidentsStore"], "readwrite");
        var store = tx.objectStore("IncidentsStore");
        store.put({incident: incidentNumber, problem: problem, address: address, date: responseDate, lat: latitude, lng: longitude, vehicles: vehicles })

        tx.oncomplete = function() {
            database.close;
        }
    };
}

// default map settings
const CONST_MAP_DEFAULT_LONGITUDEX = -95.992775
const CONST_MAP_DEFAULT_LATITUDEY  =  36.1539816
const CONST_MAP_DEFAULT_ZOOM       =  11

const CONST_MAP_INCIDENT_ZOOM      = 15

// defintion of map layers; first layer is the default layer displayed
const CONST_MAP_LAYERS = [
    {
        name: "OSM",
        url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attirbution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        minZoom:  5,
        maxZoom: 17
    },
    {
        name: "Grayscale",
        url: "http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png",
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
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

    // var myIcon = L.icon({ iconUrl: './map-marker-red-24.png'})
    var marker = new L.marker([0,0]).addTo(map);
    var url = "https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn"
    var currentIncidentNumber = "";

    function getTfdData() {
        $.ajax({ type: "GET", url: url }).done(function(response){
            
            var incident = response.Incidents.Incident[0]
            if (currentIncidentNumber == incident.IncidentNumber) {
                return;
            } else {
                currentIncidentNumber = incident.IncidentNumber;
            }
            
            //////////////////////////////////////////////////////////////////////
            var vehiclesArr = [];
            var vehicles  = incident.Vehicles.Vehicle
            var vehiclesString = "<table></br>Responding Vehicle(s):</br>"

            // if there are more than one vehicle responding then it is in an array
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

            marker.setLatLng([incident.Latitude, incident.Longitude])

            if ($(window).focus) {
                map.flyTo([incident.Latitude, incident.Longitude], CONST_MAP_INCIDENT_ZOOM)
            } else {
                map.setZoom(CONST_MAP_INCIDENT_ZOOM);
                map.panTo([incident.Latitude, incident.Longitude]);
            }

            popupString = "<center><p style='color:red;'>" + incident.Problem + "</p>Address: " + incident.Address + "</br></br>Response Date: " + incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"
            marker.bindPopup(popupString).openPopup();
            
            addIncidentToindexedDB(incident.IncidentNumber, incident.Problem, incident.Address, incident.ResponseDate, incident.Latitude, incident.Longitude, vehiclesArr) 
        })

        setTimeout(getTfdData, 60000);
    }

    getTfdData();
})