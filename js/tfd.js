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
            container.onclick = function() { toggleHotSpotMap(); }   // webpage to open when clicked
            return container;
        },

    });
    var myControl = new buttonControl();
    map.addControl(myControl);
}
//////////////////////////////////////////////////////////////////////

// !function(){"use strict";function t(i){return this instanceof t?(this._canvas=i="string"==typeof i?document.getElementById(i):i,this._ctx=i.getContext("2d"),this._width=i.width,this._height=i.height,this._max=1,void this.clear()):new t(i)}t.prototype={defaultRadius:25,defaultGradient:{.4:"blue",.6:"cyan",.7:"lime",.8:"yellow",1:"red"},data:function(t,i){return this._data=t,this},max:function(t){return this._max=t,this},add:function(t){return this._data.push(t),this},clear:function(){return this._data=[],this},radius:function(t,i){i=i||15;var a=this._circle=document.createElement("canvas"),s=a.getContext("2d"),e=this._r=t+i;return a.width=a.height=2*e,s.shadowOffsetX=s.shadowOffsetY=200,s.shadowBlur=i,s.shadowColor="black",s.beginPath(),s.arc(e-200,e-200,t,0,2*Math.PI,!0),s.closePath(),s.fill(),this},gradient:function(t){var i=document.createElement("canvas"),a=i.getContext("2d"),s=a.createLinearGradient(0,0,0,256);i.width=1,i.height=256;for(var e in t)s.addColorStop(e,t[e]);return a.fillStyle=s,a.fillRect(0,0,1,256),this._grad=a.getImageData(0,0,1,256).data,this},draw:function(t){this._circle||this.radius(this.defaultRadius),this._grad||this.gradient(this.defaultGradient);var i=this._ctx;i.clearRect(0,0,this._width,this._height);for(var a,s=0,e=this._data.length;e>s;s++)a=this._data[s],i.globalAlpha=Math.max(a[2]/this._max,t||.05),i.drawImage(this._circle,a[0]-this._r,a[1]-this._r);var n=i.getImageData(0,0,this._width,this._height);return this._colorize(n.data,this._grad),i.putImageData(n,0,0),this},_colorize:function(t,i){for(var a,s=3,e=t.length;e>s;s+=4)a=4*t[s],a&&(t[s-3]=i[a],t[s-2]=i[a+1],t[s-1]=i[a+2])}},window.simpleheat=t}(),/*
//  (c) 2014, Vladimir Agafonkin
//  Leaflet.heat, a tiny and fast heatmap plugin for Leaflet.
//  https://github.com/Leaflet/Leaflet.heat
// */
// L.HeatLayer=(L.Layer?L.Layer:L.Class).extend({initialize:function(t,i){this._latlngs=t,L.setOptions(this,i)},setLatLngs:function(t){return this._latlngs=t,this.redraw()},addLatLng:function(t){return this._latlngs.push(t),this.redraw()},setOptions:function(t){return L.setOptions(this,t),this._heat&&this._updateOptions(),this.redraw()},redraw:function(){return!this._heat||this._frame||this._map._animating||(this._frame=L.Util.requestAnimFrame(this._redraw,this)),this},onAdd:function(t){this._map=t,this._canvas||this._initCanvas(),t._panes.overlayPane.appendChild(this._canvas),t.on("moveend",this._reset,this),t.options.zoomAnimation&&L.Browser.any3d&&t.on("zoomanim",this._animateZoom,this),this._reset()},onRemove:function(t){t.getPanes().overlayPane.removeChild(this._canvas),t.off("moveend",this._reset,this),t.options.zoomAnimation&&t.off("zoomanim",this._animateZoom,this)},addTo:function(t){return t.addLayer(this),this},_initCanvas:function(){var t=this._canvas=L.DomUtil.create("canvas","leaflet-heatmap-layer leaflet-layer"),i=L.DomUtil.testProp(["transformOrigin","WebkitTransformOrigin","msTransformOrigin"]);t.style[i]="50% 50%";var a=this._map.getSize();t.width=a.x,t.height=a.y;var s=this._map.options.zoomAnimation&&L.Browser.any3d;L.DomUtil.addClass(t,"leaflet-zoom-"+(s?"animated":"hide")),this._heat=simpleheat(t),this._updateOptions()},_updateOptions:function(){this._heat.radius(this.options.radius||this._heat.defaultRadius,this.options.blur),this.options.gradient&&this._heat.gradient(this.options.gradient),this.options.max&&this._heat.max(this.options.max)},_reset:function(){var t=this._map.containerPointToLayerPoint([0,0]);L.DomUtil.setPosition(this._canvas,t);var i=this._map.getSize();this._heat._width!==i.x&&(this._canvas.width=this._heat._width=i.x),this._heat._height!==i.y&&(this._canvas.height=this._heat._height=i.y),this._redraw()},_redraw:function(){var t,i,a,s,e,n,h,o,r,d=[],_=this._heat._r,l=this._map.getSize(),m=new L.Bounds(L.point([-_,-_]),l.add([_,_])),c=void 0===this.options.max?1:this.options.max,u=void 0===this.options.maxZoom?this._map.getMaxZoom():this.options.maxZoom,f=1/Math.pow(2,Math.max(0,Math.min(u-this._map.getZoom(),12))),g=_/2,p=[],v=this._map._getMapPanePos(),w=v.x%g,y=v.y%g;for(t=0,i=this._latlngs.length;i>t;t++)if(a=this._map.latLngToContainerPoint(this._latlngs[t]),m.contains(a)){e=Math.floor((a.x-w)/g)+2,n=Math.floor((a.y-y)/g)+2;var x=void 0!==this._latlngs[t].alt?this._latlngs[t].alt:void 0!==this._latlngs[t][2]?+this._latlngs[t][2]:1;r=x*f,p[n]=p[n]||[],s=p[n][e],s?(s[0]=(s[0]*s[2]+a.x*r)/(s[2]+r),s[1]=(s[1]*s[2]+a.y*r)/(s[2]+r),s[2]+=r):p[n][e]=[a.x,a.y,r]}for(t=0,i=p.length;i>t;t++)if(p[t])for(h=0,o=p[t].length;o>h;h++)s=p[t][h],s&&d.push([Math.round(s[0]),Math.round(s[1]),Math.min(s[2],c)]);this._heat.data(d).draw(this.options.minOpacity),this._frame=null},_animateZoom:function(t){var i=this._map.getZoomScale(t.zoom),a=this._map._getCenterOffset(t.center)._multiplyBy(-i).subtract(this._map._getMapPanePos());L.DomUtil.setTransform?L.DomUtil.setTransform(this._canvas,a,i):this._canvas.style[L.DomUtil.TRANSFORM]=L.DomUtil.getTranslateString(a)+" scale("+i+")"}}),L.heatLayer=function(t,i){return new L.HeatLayer(t,i)};

//////////////////////////////////////////////////////////////////////
function toggleHotSpotMap() {
    console.log("toggle hotspot...")
    if (gbHotSpotToggle) {
        // remove hotspot
        console.log("remove hotspot...")
        gMap.removeLayer(heat)
    } else {
        // add hotspot
        console.log("add hotspot...")
        var hotspotArr = [];

        var db = indexedDB.open("TFD", 1)
        
        // https://stackoverflow.com/questions/26920961/how-to-properly-retrieve-all-data-from-an-indexeddb-in-a-winjs-windows-8-app
        db.onsuccess = function(event) {

            var db = event.target.result;
            var tx = db.transaction('Incidents');
            var list = tx.objectStore('Incidents');
            var getAll = list.openCursor();
            var items = [];

            tx.oncomplete = function() {
                // var heat = L.heatLayer([list], {radius: 25}).addTo(gMap)
                console.log(items)
                heat = L.heatLayer(items, {radius: 100, 
                                            gradient: {
                                                0.01: 'cyan', 
                                                0.25: 'yellow',
                                                0.50: 'orange', 
                                                0.75: 'red',
                                            }
                                        }).addTo(gMap);

            };

            getAll.onsuccess = function(event) {
              var cursor = event.target.result;
              if(!cursor) return;
              items.push([cursor.value.lat, cursor.value.lng, Math.random().toFixed(2) ]);
            //   console.log(items[items.length - 1])
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

    createButtonControl(map, "help-icon", CONST_HELP_TOOL_TIP,     CONST_HELP_PAGE)
    createHotSpotButtonControl(map, "hot-spot", CONST_HOTSPOT_TOOL_TIP)

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

                updateIndexedDB(response);                       // json file has updated, update indexedDB

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

