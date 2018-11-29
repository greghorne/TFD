//////////////////////////////////////////////////////////////////////
// prepare indexedDB 
var indexedDB       = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
var deleteIndexedDB = window.indexedDB.deleteDatabase("TFD")

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

        for (var counter = 0; counter < incidentsCount; counter++) {  // iterate through all json incidents

            var incident    = json.Incidents.Incident[counter];
            var vehiclesArr = getVehicles(incident.Vehicles);

            // 'put' will update a record if it exists or create a new one
            store.put({ incidentNumber: incident.IncidentNumber, problem: incident.Problem, address: incident.Address, date: incident.ResponseDate, lat: incident.Latitude, lng: incident.Longitude, vehicles: vehiclesArr })
        }

        tx.oncomplete = function() {
            database.close;
        }
    };
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// returns an array of vehicles 
function getVehicles(vehicles) {

    // if vehicles = 1; then it is a key value pair object that needs to be put into an array
    // if vehicles > 1; then it is already an array of key value pairs so just return it

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
    
    var vehiclesArr    = [];
    var vehiclesString = CONST_VEHICLES_STRING

    if (vehicles.Division) {    
        // only 1 vehicle; object of key, value paris
        var vehicleID = vehicles.VehicleID
        if (vehicleID == null) vehicleID = "";      // on occasion it has been observed that the VehicleID = null, use empty string instead
        vehiclesString += "</tr><td>" + vehicles.Division + "</td><td>" + vehicles.Station + "</td><td>" + vehicleID + "</td>"
        vehiclesArr.push( {division: vehicles.Division, station: vehicles.Station, vehicleID: vehicles.VehicleID} )
    } else {
        // more than 1 vehicle; array of key, value pairs
        for (var counter = 0; counter < vehicles.length; counter++) {
            vehiclesString += "</tr><td>" + vehicles[counter].Division + "</td><td>" + vehicles[counter].Station + "</td><td>" + vehicles[counter].VehicleID + "</td>"
            vehiclesArr.push( {division: vehicles[counter].Division, station: vehicles[counter].Station, vehicleID: vehicles[counter].VehicleID} )
        }
    }

    vehiclesString += "</table>"
    fnCallback(vehiclesString);
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// read in url parameters and parse into an object
// function is unforgiving, any error returns empty object
function getUrlParameterOptions(url, fnCallback) {

    try {
        var paramsArr = url.split("&")
        var myObject  = {}
        var params, myKey, myValue

        for (var counter = 0; counter < paramsArr.length; counter++) {
            params  = paramsArr[counter].split("=");
            myKey   = params[0]
            myValue = params[1];

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

    if (params['recent'] && params['recent'] > 0 && params['recent'] <= CONST_YELLOW_MARKER_MAX_COUNT) { gnRecentMarkersToDisplay = params['recent'] } 
    else { gnRecentMarkersToDisplay = CONST_YELLOW_MARKER_DEFAULT_COUNT }

    if (params['zoomTo']) { gbZoomTo = eval(params['zoomTo']) } 
    else { gbZoomTo = CONST_MAP_AUTOZOOM_TO_INCIDENT }

    if (params['filter']) { gSearchText = params['filter'].replace("%20", " ").split("&")[0].split(",") } 
    else { gSearchText = null }

    if (params['baseLayer'] && params['baseLayer'] >=0 && params['baseLayer'] < CONST_MAP_LAYERS.length) { gnBaseLayer = params['baseLayer'].replace("%20", " ").split("&")[0].split(",") } 
    else { gnBaseLayer = 0 }
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates controls found in the lower right of the app
// this is a text control with info on a given incident
function createIncidentTextControl(map, marker, bHighlight, title, textCustomControlArr) {
     
    var textCustomControl = L.Control.extend({
        options: {
            position: 'bottomright' 
        },

        onAdd: function() {
            var container;

            if (bHighlight) {
                container = L.DomUtil.create('div', 'highlight-background custom-control cursor-pointer leaflet-bar', L.DomUtil.get('map'));
                container.innerHTML = "<center>" + marker.options['title'] + "</center>"
            } else {
                container = L.DomUtil.create('div', 'normal-background custom-control cursor-pointer leaflet-bar', L.DomUtil.get('map'));
                container.innerHTML = "<center>" + marker.options['title'] + "</center>"
            }
           
            // tooltip
            if (title) container.title = title

            L.DomEvent.on(container, 'click', function(e) {
                L.DomEvent.stopPropagation(e);
                map.flyTo(marker._latlng, CONST_MAP_INCIDENT_ZOOM)
                setTimeout(function() { marker.openPopup(); }, 1000)  // delay opening marker popup
            })

            container.onmouseover = function() { L.DomUtil.addClass(map._container,   'cursor-pointer') }
            container.onmouseout  = function() { L.DomUtil.removeClass(map._container,'cursor-pointer') }

            return container;
        },

        onRemove: function(map) { }

    });

    var myControl = new textCustomControl();
    textCustomControlArr.push(myControl)
    map.addControl(myControl);
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates a text control on the map that lists filter keywords
function createFilterTextControl(map, filterTextControl) {

    var filterCustomControl = L.Control.extend({
        options: {
            position: 'bottomright' 
        },

        onAdd: function(map) {
            var container       = L.DomUtil.create('div', 'filter-control leaflet-bar', L.DomUtil.get('map'));
            var text            = gSearchText.toString()
            container.innerHTML = "<center>Filter Keyword(s): " + text + "</center>"
            return container;
        },

    });
    filterTextControl = new filterCustomControl();
    map.addControl(filterTextControl);

    return filterTextControl;
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates button control 
function createButtonControl(map, className, toolTip, urlToOpen) {
     
    var buttonControl = L.Control.extend({
        options: {
            position: 'topright' 
        },

        onAdd: function(map) {
            var container     = L.DomUtil.create('div', className + " button-custom cursor-pointer leaflet-bar", L.DomUtil.get('map'));
            container.title   = toolTip
            container.onclick = function() { window.open(urlToOpen) }   // webpage to open when clicked
            return container;
        },

    });
    var myControl = new buttonControl();
    map.addControl(myControl);
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// creates button control 
function createHotSpotButtonControl(map, className, toolTip) {
     
    var buttonControl = L.Control.extend({
        options: {
            position: 'topright' 
        },

        onAdd: function(map) {
            var container     = L.DomUtil.create('div', className + " button-custom cursor-pointer leaflet-bar", L.DomUtil.get('map'));
            container.title   = toolTip
            container.onclick = function() { toggleHotSpotMap("button"); }   // webpage to open when clicked
            return container;
        },

    });
    var myControl = new buttonControl();
    map.addControl(myControl);
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function updateIncidentTypeList(fnCallback) {

    var db = indexedDB.open("TFD", 1)
    
    // https://stackoverflow.com/questions/26920961/how-to-properly-retrieve-all-data-from-an-indexeddb-in-a-winjs-windows-8-app
    db.onsuccess = function(event) {

        var db        = event.target.result;
        var tx        = db.transaction('Incidents');
        var list      = tx.objectStore('Incidents');
        var getAll    = list.openCursor();
        var items     = [];
        var json      = {};

        tx.oncomplete = function() {
            items.forEach(function (v, i) {
                if (json[v]) { json[v] = json[v] + 1; } 
                else { json[v] = 1; }
            })
            fnCallback(json);
        };

        getAll.onsuccess = function(event) {
            var cursor = event.target.result;

            if(!cursor) return;
            items.push(cursor.value.problem);
            cursor.continue();
        };
    }
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function toggleHotSpotMap(whoCalled) {
    console.log(whoCalled)
    
    if (gbHotSpotToggle) {
        // remove hotspot
        gMap.removeLayer(heat)
    } else {
        // add hotspot
        var hotspotArr = [];
        var db = indexedDB.open("TFD", 1)
        
        // https://stackoverflow.com/questions/26920961/how-to-properly-retrieve-all-data-from-an-indexeddb-in-a-winjs-windows-8-app
        db.onsuccess = function(event) {

            var db     = event.target.result;
            var tx     = db.transaction('Incidents');
            var list   = tx.objectStore('Incidents');
            var getAll = list.openCursor();
            var items  = [];

            var intensity = 0;

            var typeIncident = $("#incident_types option:selected").val();

            console.log(typeIncident)

            tx.oncomplete = function() {

                heat = L.heatLayer(items, { radius: 45, minOpacity: .1, maxZoom: 12, blur: 75,
                                            gradient: { .01: '#FFEBCD', .25: '#FFE4C4', .45: '#FFDEAD', .65: '#F5DEB3', .85: '#DC143C' }
                                          }
                                  ).addTo(gMap);

            };

            getAll.onsuccess = function(event) {
                var cursor = event.target.result;
                
                if(!cursor) return;
                intensity = .0
                
                if (cursor.value.problem === typeIncident) intensity = .9
                items.push([cursor.value.lat, cursor.value.lng, intensity ]);

                cursor.continue();
            };
        }
    }
    gbHotSpotToggle = !gbHotSpotToggle;

}
//////////////////////////////////////////////////////////////////////


///////'s///////////////////////////////////////////////////////////////
// check if any of the url parameter 'filter' keywords are found in the incdent's 'Problem' text/description
function foundInFilterText(txtProblem) {

    if (gSearchText) {
        for (var counter = 0; counter < gSearchText.length; counter++) {
            if (txtProblem.toLowerCase().indexOf(gSearchText[counter].toLowerCase()) > -1) {
                return true;
            }
        }
    }
    return false;
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function moveMarker(fromMarkers, toMarkers, markerColor, classToRemove, classToAdd) {

    // remove oldest marker from fromMarkers and add it to toMarkers
    // either a red marker becoming yellow OR a yellow marker becoming blue
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
////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function fifoMarkers(newestMarkersArr, recentMarkersArr, olderMarkersArr) {
   
    // as necessary shift out marker(s) from newestMarkersArr[] and push to recentMarkersArr[]
    while (newestMarkersArr.length > CONST_RED_MARKER_MAX_COUNT) {
        // move red marker to recentMarkersArr
        moveMarker(newestMarkersArr, recentMarkersArr, CONST_MARKER_YELLOW, "blink", "blinkSlower")
        newestMarkersArr.shift()
    }  
    
    // as necessary shift out marker(s) from recentMarkersArr[] and push to olderMarkersArr[]
    while (recentMarkersArr.length > gnRecentMarkersToDisplay) {
        moveMarker(recentMarkersArr, olderMarkersArr, CONST_MARKER_BLUE, "blinkSlower")
        recentMarkersArr.shift()
    }
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function createRedMarker(incident) {

    var marker;
    var vehicles = incident.Vehicles.Vehicle
    
    buildVehicleHTMLString(vehicles, function(vehiclesString) {
        var toolTip = incident.Problem + " - " + incident.Address + " - " + incident.ResponseDate.split(" ")[1] + incident.ResponseDate.split(" ")[2]
        marker      = new L.marker([incident.Latitude, incident.Longitude], {title: toolTip, riseOnHover: true});

        var markerPopupString = "<center><p id='text_popup';'>" + incident.Problem + "</p>Address: " + incident.Address + "</br></br>Response Date: " +            
                                incident.ResponseDate + "</br></br>Incident Number: " + incident.IncidentNumber + "</br>" + vehiclesString + "</br></center>"
        marker.bindPopup(markerPopupString, {autoPan: false});

    })
    marker.setIcon(CONST_MARKER_RED)
    return marker;
}
////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////
function processNewIncident(map, incident, newestMarkersArr, recentMarkersArr, olderMarkersArr) {

    var marker = createRedMarker(incident); 
    newestMarkersArr.push(marker)
    marker.addTo(map);

    // per Intert ==> this is a workaround; setting "blink" in the L.marker statement offsets the marker and popup
    function blink() { L.DomUtil.addClass(marker._icon, "blink"); }
    blink();    

    fifoMarkers(newestMarkersArr, recentMarkersArr, olderMarkersArr)
}
///////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////
function clearTextControls(map, textCustomControlArr, fnCallback) {

    while (textCustomControlArr.length > 0) {  
        map.removeControl(textCustomControlArr[0])
        textCustomControlArr.shift(0, 1);
    }
    fnCallback();
}
////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////
function addControlsToMap(map, buildings) {

    L.control.layers(gbaseMaps, {"3D-Buildings": buildings}).addTo(map)  // add all map layers to layer control
    L.control.scale({imperial: true, metric: true}).addTo(map) // add scalebar

    createHotSpotButtonControl(map, "hot-spot", CONST_HOTSPOT_TOOL_TIP)

    initSidebarButton(map, "sidebar-icon", "Open/Close Sidebar", sidebarOpenClose);
    gSidebar = initSlideOutSidebar(map)
    gSidebar.setContent(gSidebarHTML);

    createButtonControl(map, "help-icon", CONST_HELP_TOOL_TIP, CONST_HELP_PAGE)

    // createButtonControl(map, "citygram-icon", CONST_CITYGRAM_TOOL_TIP, CONST_CITYGRAM_PAGE)
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function createRecentControls(map, recentMarkersArr, bHighlight, textCustomControlArr, fnCallback) {
 
    // create text controls for recentMarkersArr (lower right controls)
    for (var counter = 0;  counter < gnRecentMarkersToDisplay; counter++) {
        if (recentMarkersArr[counter]) {
            
            var toolTip = null  // add a tooltip for the first and last recentMarkersArr[]
            switch(counter) {
                case 0:                             toolTip = CONST_OLDEST_RECENT_INCIDENT; break;
                case (recentMarkersArr.length - 1): toolTip = CONST_NEWEST_RECENT_INCIDENT; break;
            }
            createIncidentTextControl(map, recentMarkersArr[counter], bHighlight, toolTip, textCustomControlArr)
        }
    }
    fnCallback()
}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function createOlderControl(map, olderMarkersArr) {

    // pull-down that lists 'older' incidents (blue markers)

    var olderPullDownControl = L.Control.extend({
        options: {
            position: 'bottomright' 
        },

        onAdd: function(map) {

            var container = L.DomUtil.create('div', 'cursor-pointer older-control leaflet-bar select', L.DomUtil.get('map'));

            for (var counter = olderMarkersArr.length - 1; counter > -1; counter --) {
                container.innerHTML += "<option value=" + olderMarkersArr[counter]._latlng.lat + "_" + olderMarkersArr[counter]._latlng.lng + "_" + olderMarkersArr[counter]._leaflet_id + ">" + olderMarkersArr[counter].options['title'] + "</option>"
            }
            container.innerHTML = "<center><select id='old_select'>" + "<option disabled selected value> -- Older Incidents -- </option>" + container.innerHTML + "</select></center>"

            L.DomEvent.on(old_select, 'change', function(e) {

                L.DomEvent.stopPropagation(e);
                var arrSplit = e.target.value.split("_")
                map.flyTo([arrSplit[0], arrSplit[1]], CONST_MAP_INCIDENT_ZOOM)

                setTimeout(function() { 
                    var myMarker = map._layers[arrSplit[2]];  // retrieve marker
                    myMarker.fireEvent('click',{ latlng: [arrSplit[0], arrSplit[1]]}) 
                    $("#old_select")[0][0].selected = true;   // set pull-down to index 0
                }, 1000)  // delay opening marker popup
            })
            
            return container;
        },

    });
    var customControl = new olderPullDownControl();
    map.addControl(customControl);

    return customControl;

}
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
function updateIncidentTypePullDown(json) {

    var dropdown = document.getElementById("incident_types");
    $(dropdown).empty();

    for (var key in json) {
        jQuery(document.createElement('option'))
            .attr('value', key)
            .text(key + " - " + json[key])
            .appendTo(dropdown)
    }
}
//////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////
function initSidebarButton(map, classString, toolTip, fn) {
    
    var buttonCustomControl = L.Control.extend({
        options: {
            position: 'topright' 
        },
        onAdd: function(map) {
            var container     = L.DomUtil.create('div', classString + ' sidebar-icon button-custom cursor-pointer leaflet-bar');
            container.title   = toolTip
            container.onclick = function(e){ 
                L.DomEvent.stopPropagation(e);
                fn();
            }
            return container;
        }
    });
    map.addControl(new buttonCustomControl());
}
////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////
function sidebarOpenClose() { 
    if (gSidebar.isVisible()) { 
        gSidebar.hide() 
    } else { 
        setTimeout(function () { 
            gSidebar.show(); 
        }, CONST_SLIDEOUT_DELAY_TIME)
    }
}
////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////
function initSlideOutSidebar(map) {
    // credit: https://github.com/Turbo87/leaflet-sidebar
    gSidebar = L.control.sidebar('sidebar', {
        position:    'left',
        closeButton: true,
        autoPan:     false
    });

    map.addControl(gSidebar);
    return gSidebar;
}
////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// url param variables
var gnRecentMarkersToDisplay
var gbZoomTo
var gSearchText = null
var gnBaseLayer
var gbHotSpotToggle = false;
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// build map layers dynamically from CONST_MAP_LAYERS
var gmapLayers  = [];
var gbaseMaps   = {};


for (n = 0; n < CONST_MAP_LAYERS.length; n++) {
    gmapLayers[n] = L.tileLayer(CONST_MAP_LAYERS[n].url, { 
        attribution: CONST_MAP_LAYERS[n].attribution, 
        minZoon:     CONST_MAP_LAYERS[n].minZoom, 
        maxZoom:     CONST_MAP_LAYERS[n].maxZoom 
    })
    gbaseMaps[[CONST_MAP_LAYERS[n].name]] = gmapLayers[n];
}
//////////////////////////////////////////////////////////////////////


var gSidebar;
var gSidebarHTML = CONST_SLIDEOUT_HTML;


//////////////////////////////////////////////////////////////////////
$(document).ready(function() {

    var textCustomControlArr  = []; 
    var filterTextControl     = null;
    var olderControl          = null;

    var allIncidentNumbersArr = [];

    var newestMarkersArr      = [];
    var recentMarkersArr      = [];
    var olderMarkersArr       = [];

    var lastGoodIncident      = null;

    var incidentTypeList      = null;

    // read in and process url parameters
    var params = getUrlParameterOptions(window.location.search.slice(1), function(params) {
        if (params !== {}) processParams(params)
    });
    
    // if mobile device then limit recent markers to 5
    if (window.navigator.userAgent.toLowerCase().includes("mobi")) gnRecentMarkersToDisplay = 5

    // create map and define position, zoom and baselayer
    var map = L.map('map', {
        center: [ CONST_MAP_DEFAULT_LATITUDEY, CONST_MAP_DEFAULT_LONGITUDEX ],
        zoom: CONST_MAP_INITIAL_ZOOM,
        layers: [gmapLayers[gnBaseLayer]]
    });

    gMap = map

    // add 3-D buildings
    var osmb = new OSMBuildings().load(CONST_3D_BUILDINGS_URL);
    
    addControlsToMap(map, osmb);

    //////////////////////////////////////////////////////////////////////
    function getTfdData() {

        $.ajax({ type: "GET", url: CONST_MAP_JSON_URL }).done(function(response){

            //////////////////////////////////////////////////////////////////////
            // check if we have seen this incident number before
            if (allIncidentNumbersArr.indexOf(response.Incidents.Incident[0].IncidentNumber) == -1) {      

                updateIndexedDB(response);                        // json file has updated, update indexedDB
                
                // update pull down menu based on incident types that have occurred
                updateIncidentTypeList(function (json) {
                    updateIncidentTypePullDown(json);       
                })

                var incidents      = response.Incidents          // all json incidents
                var incidentsCount = incidents.Incident.length;  // number of json incidents

                //////////////////////////////////////////////////////////////////////
                // iterate through all of the JSON incidents backwards, oldest incident first
                for (var counter = incidentsCount - 1; counter >= 0; counter--) {

                    var incident = incidents.Incident[counter]  // fetch incident

                    // check if the incident number is in the array 
                    if (allIncidentNumbersArr.indexOf(incident.IncidentNumber) == -1) {     
                        
                        allIncidentNumbersArr.push(incident.IncidentNumber)  // push new incident number onto array

                        // check if given incident's 'Problem' text meets filtering requirements
                        var bFound = false
                        if (gSearchText) { bFound = foundInFilterText(incident.Problem) }  

                        // if filter requirement is met OR there is no filter to apply, process the new incident
                        if (bFound || gSearchText == null) { 
                            processNewIncident(map, incident, newestMarkersArr, recentMarkersArr, olderMarkersArr)
                            lastGoodIncident = incident
                        }
                    }
                }
                //////////////////////////////////////////////////////////////////////

                //////////////////////////////////////////////////////////////////////
                // update text controls at the lower right of the map
                clearTextControls(map, textCustomControlArr, function() {
                    if (olderControl) map.removeControl(olderControl);
                    olderControl = createOlderControl(map, olderMarkersArr)

                    createRecentControls(map, recentMarkersArr, false, textCustomControlArr, function() {

                        if (lastGoodIncident) {             // create text conrtol for newestMarkersArr
                            createIncidentTextControl(map, newestMarkersArr[newestMarkersArr.length - 1], true, "Current Incident", textCustomControlArr)
                            newestMarkersArr[newestMarkersArr.length - 1].openPopup()
                            if (gbZoomTo) { map.flyTo(newestMarkersArr[newestMarkersArr.length - 1]._latlng, CONST_MAP_INCIDENT_ZOOM) }
                        }
                        
                        if (gSearchText !== null) {         // create text control for filter keyword(s) if applicable
                            if (filterTextControl) { map.removeControl(filterTextControl) }
                            filterTextControl = createFilterTextControl(map, filterTextControl)
                        }
                    })
                });
                //////////////////////////////////////////////////////////////////////

            }
            //////////////////////////////////////////////////////////////////////

         })
        setTimeout(getTfdData, CONST_JSON_UPDATE_TIME);
    }
    //////////////////////////////////////////////////////////////////////

    getTfdData();
})

