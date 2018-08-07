//////////////////////////////////////////////////////////////////////
const CONST_MAP_DEFAULT_LONGITUDEX    = -95.992775
const CONST_MAP_DEFAULT_LATITUDEY     =  36.1539816
const CONST_MAP_DEFAULT_ZOOM          =  11

const CONST_MAP_JSON_URL              = "https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn"
const CONST_JSON_UPDATE_TIME          = 60000    // how often to poll for JSON data from server in ms

const CONST_MAP_INCIDENT_ZOOM         = 15
const CONST_MAP_AUTOZOOM_TO_INCIDENT  = true

const CONST_NUM_RECENT_MARKERS_TO_DISPLAY = 10   // number of yellow markers to display

const CONST_PIN_ANCHOR           = new L.Point(25/2, 41);
const CONST_MARKER_COLOR_RED     = "./images/marker-icon-red.png";
const CONST_MARKER_COLOR_YELLOW  = "./images/marker-icon-yellow.png"

const CONST_MARKER_RED           = new L.Icon({ iconUrl: CONST_MARKER_COLOR_RED,    iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });
const CONST_MARKER_YELLOW        = new L.Icon({ iconUrl: CONST_MARKER_COLOR_YELLOW, iconsize: [25, 41], iconAnchor: CONST_PIN_ANCHOR, popupAnchor: [0,-41] });

const CONST_GITHUB_PAGE          = "https://github.com/greghorne/TFD"

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
// make the red marker blue
function clearCurrentMarker(marker) {    
    marker.closePopup();
    L.DomUtil.removeClass(marker._icon, "blink");
    marker.setIcon(new L.Icon.Default());
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
    
    if (params['recent'] && params['recent'] > 0 && params['recent'] <= 20) { gnRecentMarkersToDisplay = params['recent'] } 
    else { gnRecentMarkersToDisplay = CONST_NUM_RECENT_MARKERS_TO_DISPLAY }

    if (params['zoomTo']) { gbZoomTo = params['zoomTo'] } 
    else { gbZoomTo = CONST_MAP_AUTOZOOM_TO_INCIDENT }

    if (params['filter']) { gSearchText = params['filter'].replace("%20", " ").split("&")[0].split(",") } 
    else { gSearchText = null }
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// make the marker red and flashing
function processCurrentIncident(map, currentMarker, incident) {
    currentMarker.setIcon(CONST_MARKER_RED)
    currentMarker.openPopup();
    if (eval(gbZoomTo) ) { map.flyTo([incident.Latitude, incident.Longitude], CONST_MAP_INCIDENT_ZOOM); }

    // per Internet ==> this is a workaround; setting "blink" in the L.marker statement offsets the marker and popup
    function blink() { L.DomUtil.addClass(currentMarker._icon, "blink"); }
    blink();
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// make the array of markers yellow and flashing
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
// creates controls found in the lower right of the app
// this is a text control with text info on a given incident
function createIncidentTextControl(map, info, latlng, bHighlight, title) {
     
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


var gtextCustomControlArr = []
var gnRecentMarkersToDisplay
var gbZoomTo
var gSearchText = []
var gFilterTextControl


//////////////////////////////////////////////////////////////////////
// here we go
$(document).ready(function() {

    var marker;
    var markers = [];
    var currentMarker;
    var recentMarkers = [];
    var currentIncidentNumber = "";
    var lastGoodMarker;
    var lastGoodIncident

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


    // current incident is a red marker (the newest incident in the json files)
    // recent incidents are yellow markers (prior to the current incident in which the count can vary)


    ///////////////////////////////////////
    function getTfdData() {

        $.ajax({ type: "GET", url: CONST_MAP_JSON_URL }).done(function(response){

            var incidents               = response.Incidents                    // all json incidents
            var incidentsCount          = incidents.Incident.length;            // number of json incidents
            var latestIncidentNumber    = incidents.Incident[0].IncidentNumber  // most recent incident from the json object

            // if the following is true, a new incident has occurred (json file has updated)
            // if (currentIncidentNumber !== latestIncidentNumber && (bFound || gSearchText == null)) {
            if (currentIncidentNumber !== latestIncidentNumber) {

                updateIndexedDB(response);  // json file has updated

                if (currentMarker) { 
                    clearCurrentMarker(currentMarker)   // turn red marker into blue marker
                    recentMarkers.push(currentMarker)   // and then add to array of recent markers
                }
                    
                // iterate through all of the JSON incidents backwards, oldest incident first
                for (var counter = incidentsCount - 1; counter >= 0; counter--) {
                    var incident = incidents.Incident[counter]  // fetch incident

                    if (gSearchText) { var bFound = foundInSearchText(incident.Problem) }  // check if given incident applies to a text filter

                    if (bFound || gSearchText == null) {    // if meets text filter requirement OR there are no text filters appliled

                        // see if the incidentNumber is in an array
                        if (markers.indexOf(incident.IncidentNumber) == -1) {

                            markers.push(incident.IncidentNumber)   // add incident number to array; array contains incident number for all markers that have been created
                            var vehicles  = incident.Vehicles.Vehicle
                            buildVehicleHTMLString(vehicles, function(vehiclesString) {
                                markerPopupString = "<center><p style='color:red;'>" + incident.Problem + "</p>Address: " + incident.Address + "</br></br>Response Date: " +            
                                                    incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"
                                
                                marker = new L.marker([incident.Latitude, incident.Longitude], {title: incident.Problem + " - " + incident.Address + " - " + incident.ResponseDate.split(" ")[1] + incident.ResponseDate.split(" ")[2], riseOnHover: true}).addTo(map);
                                marker.bindPopup(markerPopupString);

                                // if (counter > 0 && (recentMarkers.length <= gnRecentMarkersToDisplay)) {
                                if (counter > 0) {
                                    recentMarkers.push(marker)  // keep track of marker; push marker into array
                                }
                                // lastGoodIncident = incident
                                // lastGoodMarker   = marker
                            })
                            lastGoodMarker   = marker
                            lastGoodIncident = incident
                        }
                    } 
                }
                console.log(markers)

                // process the yellow and red markers
                if (recentMarkers.length > 0) {     // recentMarkers could be empty if a keyword filter is applied

                    // following is a special case since all incidents will get a marker since they don't exisit in an array
                    // thus, destroy the marker and remove it from the array
                    while  (recentMarkers.length >  gnRecentMarkersToDisplay) {
                        markers.shift()
                        recentMarkers.shift()
                    }
                    console.log("trace...")
                    console.log(markers)


                    recentMarkers = processRecentIncidents(recentMarkers)   // make the array of markers yellow

                    console.log("trace2...")
                    console.log(markers)

                    currentIncidentNumber   = latestIncidentNumber;        
                    currentMarker           = lastGoodMarker
                    console.log("trace3...")
                    console.log(lastGoodIncident)
                    console.log(lastGoodMarker)
                    processCurrentIncident(map, lastGoodMarker, lastGoodIncident)     // make current incident marker red and blink and pan/zoom to marker

                    while (gtextCustomControlArr.length > 0) {                        // clear map of bottom right text controls
                        map.removeControl(gtextCustomControlArr[0])
                        gtextCustomControlArr.shift(0, 1);
                        
                    }
                    console.log("trace3.1...")
                    console.log(recentMarkers.length)
                    console.log(recentMarkers)

                    // process the recent incidents (yellow markers)
                    for (var counter = 0; counter < recentMarkers.length; counter++) {
                        
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
                            createIncidentTextControl(map, msg, myMarker._latlng, false, toolTip)
                        }
                    }
                    // if true; remove the most recent marker since it is actually the current marker (incident)
                    console.log("trace4...")
                    console.log(recentMarkers.length)
                    console.log(recentMarkers)
                    if (recentMarkers.length > gnRecentMarkersToDisplay) {
                        
                        map.removeControl(gtextCustomControlArr[0])
                        gtextCustomControlArr.splice(0)
                        // recentMarkers.splice(-1, 1)
                        // markers.splice(-1, 1)
                    } else {
                        // map.removeControl(gtextCustomControlArr[gtextCustomControlArr.length - 1])
                        // gtextCustomControlArr.pop()
                    }
                    createIncidentTextControl(map, lastGoodIncident.Problem + " - " + lastGoodIncident.Address + " - " + lastGoodIncident.ResponseDate.split(" ")[1] + lastGoodIncident.ResponseDate.split(" ")[2], [incident.Latitude, incident.Longitude], true, "Current Incident")

                    // if there is a filter then add the filter text control that lists keywords
                    if (gSearchText !== null) {         
                        if (gFilterTextControl) { map.removeControl(gFilterTextControl)}
                        createFilterTextControl(map)
                    }
                }

            }
        })
        setTimeout(getTfdData, CONST_JSON_UPDATE_TIME);
    }
    getTfdData();
})

