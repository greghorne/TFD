// prepare indexedDB 
var deleteIndexedDB = window.indexedDB.deleteDatabase("TFDIncidents")
var indexedDB       = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

// prefixes of window.IDB objects
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange    = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
 
var openedDB = indexedDB.open("TFDIncidents", 1);

// key definition
openedDB.onupgradeneeded = function() {
    var db    = openedDB.result;
    var store = db.createObjectStore("IncidentsStore", {keyPath: "id", autoIncrement: true});
}

// add location info to indexedDB
function addIncidentToindexedDB(incidentNumber, problem, address, responseDate, latitude, longitude) {

    var db      = openedDB
    db.onsuccess = function(event) {
        console.log("tx...")
        db = event.target.result;
        var tx      = db.transaction(["IncidentsStore"], "readwrite");
        var store   = tx.objectStore("IncidentsStore", {keyPath: "id", autoIncrement: true});
        store.put({incidentNumber: incidentNumber, problem: problem, address: address, responseDate: responseDate, latitude: latitude, longitude: longitude})
    };
}


// default map settings
const CONST_MAP_DEFAULT_LONGITUDEX = -95.992775
const CONST_MAP_DEFAULT_LATITUDEY  =  36.1539816
const CONST_MAP_DEFAULT_ZOOM       =  11

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

var map;


$(document).ready(function() {

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
            
            incident = response.Incidents.Incident[0]

            if (currentIncidentNumber == incident.incidentNumber) {
                console.log("nothing...")
                return;
            } else {
                console.log(incident)
                currentIncidentNumber = incident.incidentNumber;
            }
// console.log(incident.IncidentNumber)
// console.log(incident.Problem)
// console.log(incident.Address)
// console.log(incident.ResponseDate)
// console.log(incident.Latitude)
// console.log(incident.Longitude)
            
            
            //////////////////////////////////////////////////////////////////////
            vehicles  = incident.Vehicles.Vehicle
            vehiclesString = "<table></br>Respondig Vehicles:</br>"

            // if there are more than one vehicles respongind then it is in an array
            if (vehicles.Division) {
                vehiclesString += "</tr><td>" + vehicles.Division + "</td><td>" + vehicles.Station + "</td><td>" + vehicles.VehicleID + "</td>"
            } else {
                for (n = 0; n < vehicles.length; n++) {
                    vehiclesString += "</tr><td>" + vehicles[n].Division + "</td><td>" + vehicles[n].Station + "</td><td>" + vehicles[n].VehicleID + "</td>"
                }
            }
            vehiclesString += "</table>"
            //////////////////////////////////////////////////////////////////////


            marker.setLatLng([incident.Latitude, incident.Longitude])

            popupString = "<center>Problem: " + incident.Problem + "</br></br>Address: " + incident.Address + "</br></br>Response Date: " + incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"
            marker.bindPopup(popupString).openPopup();
            map.flyTo([incident.Latitude, incident.Longitude], 15)

            addIncidentToindexedDB(incident.IncidentNumber, incident.Problem, incident.Address, incident.ResponseDate, incident.Latitude, incident.Longitude) 

        })

        setTimeout(getTfdData, 60000);
    }

    getTfdData();

})