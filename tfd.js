// prepare indexedDB 
var deleteIndexedDB = window.indexedDB.deleteDatabase("TFDIncidents")
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
    } else {
        return vehicles;
    }
    return vehiclesArr;

}


function updateIndexedDB(json) {
    
    var db = indexedDB.open("TFDIncidents", 1);

    db.onupgradeneeded = function() {
        var database    = db.result;
        var store = database.createObjectStore("IncidentsStore", {keyPath: "incidentNumber", unique: true});
    }

    db.onsuccess = function() {

        var database = db.result
        var tx       = database.transaction(["IncidentsStore"], "readwrite");
        var store    = tx.objectStore("IncidentsStore");

        var incidentsCount = json.Incidents.Incident.length;

        // iterate through json
        for (var n = 0; n < incidentsCount; n++) {

            var incident = json.Incidents.Incident[n];

            // for storing vehicle(s)
            var vehiclesArr = [];
            var vehicles    = incident.Vehicles
            vehiclesArr     = getVehicles(vehicles);

            // The put() method of the IDBObjectStore interface updates a given record in a database, 
            // or inserts a new record if the given item does not already exist.
            //
            // This area may need attention in that working with IndexedDB is asynchronous in nature
            // and I am currently not taking that into account.
            var put = store.put({ incidentNumber: incident.IncidentNumber, problem: incident.Problem, address: incident.Address, date: incident.ResponseDate, lat: incident.Latitude, lng: incident.Longitude, vehicles: vehiclesArr })
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
    var markers = [];
    var url = CONST_MAP_JSON_URL;
    var currentIncidentNumber = "";


    // /////////////////////////////////////
    function getTfdData() {
        $.ajax({ type: "GET", url: url }).done(function(response){

            // always update
            updateIndexedDB(response);

            var incidents       = response.Incidents
            var incidentsCount  = incidents.Incident.length;
            console.log(incidentsCount)

            var lastIncident = incidents.Incident[0].IncidentNumber
            console.log(lastIncident)

            if (currentIncidentNumber !== lastIncident) {
                // json was updated

                if (marker) {
                    marker.closePopup();
                    L.DomUtil.removeClass(marker._icon, "blinking");
                }

                for (var counter = 0; counter < incidentsCount; counter++) {

                    var incident = incidents.Incident[counter]
                    // console.log(incident)

                    // see if the marker alreadey exists
                    // console.log(incident.IncidentNumber)
                    
                    if (markers.indexOf(incident.IncidentNumber) == -1) {

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

                        marker = new L.marker([incident.Latitude, incident.Longitude], {title: incident.Problem, riseOnHover: true}).addTo(map);
                        popupString = "<center><p style='color:red;'>" + incident.Problem + "</p>Address: " + incident.Address + "</br></br>Response Date: " + incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"
                        

                        markers.push(incident.IncidentNumber)

                        if (counter === 0) {
                            marker.bindPopup(popupString).openPopup();
                            map.flyTo([incident.Latitude, incident.Longitude], CONST_MAP_INCIDENT_ZOOM)
                            // this is a workaround; setting "blinking" in the L.marker statement offsets the marker and popup
                            console.log("here...")
                            function blink() {
                                L.DomUtil.addClass(marker._icon, "blinking");
                            }
                            blink();
                        }

                    }
                
                }

            }
        })
        setTimeout(getTfdData, 300000);
    }
    getTfdData();
})


            // console.log(incidents.Incident.length)

            // for (var index = 0 ; index < incidents.Incident.length; index++) {
                
            //     console.log("index: " + index)
            //     var incident  = incidents.Incident[index]
            //     console.log(incident)

                // var incident  = response.Incidents.Incident[n]
                // if (currentIncidentNumber == incident.IncidentNumber) {
                //     return;
                // } else {
                //     currentIncidentNumber = incident.IncidentNumber;
                //     // updateIndexedDB(response);
                // } 

                // if (marker) {
                //     marker.closePopup();
                //     L.DomUtil.removeClass(marker._icon, "blinking");
                //     marker.onmouseover = function() { marker.openPopup();}
                //     marker.onmouseout  = function() { marker.closePopup();}
                // }

                // if ($(window).focus) {
                //     map.flyTo([incident.Latitude, incident.Longitude], CONST_MAP_INCIDENT_ZOOM)
                // } else {
                //     map.setZoom(CONST_MAP_INCIDENT_ZOOM);
                //     map.panTo([incident.Latitude, incident.Longitude]);
                // }

            // }
