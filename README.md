# TFD

**Display City of Tulsa Fire Department incidents on a map.**

* **What does it do?**

    * Polls City of Tulsa Fire Department incident data every 1 minute.
    * The map will center and zoom to the newest incident and display as a red map marker. 
    * The 10 previous incidents are displayed as yellow map markers.
    * All older incidents are displayed as blue map markers.
    * It is possible for a marker to end up directly on top of another marker when more than one incident has occurred at the same location.

#

| Map Marker Incident | Icon          |
|:-------------:|:-------------:|
| Newest | ![Alt text](https://rawgit.com/greghorne/TFD/master/images/marker-icon-red.png "Current Incident") |
| Recent | ![Alt text](https://rawgit.com/greghorne/TFD/master/images/marker-icon-yellow.png "Recent Incident") |
| Older | ![Alt text](https://rawgit.com/greghorne/TFD/master/images/marker-icon-blue.png "Older Incident") |

#
**Deployment:** https://rawgit.com/greghorne/TFD/master/index.html

#

**There are 4 options that may be added to the URL as parameters to override default settings**

**1) recent=number** - change the number of recent incidents (yellow markers) displayed; valid values are 1 thru 20; default=10

	https://rawgit.com/greghorne/TFD/master/index.html?recent=7
#
**2) zoomTo=boolean** - when false, turns off automatic panning and zoom to a new incident; default=true

	https://rawgit.com/greghorne/TFD/master/index.html?zoomTo=false
#
**3) filter=text** - comma delimited keywords/phrases to filter incidents; keywords are not case sensitive; do not add unnecessary spaces/blanks and no spaces/blanks next to commas

	https://rawgit.com/greghorne/TFD/master/index.html?filter=Fire

	https://rawgit.com/greghorne/TFD/master/index.html?filter=fire,Odor,Motor%20Vehicle
#
**4) baseLayer=number** - defines which base map to display on startup

                   0 = Grayscale OSM (default)
                   1 = Esri OSM
                   2 = Hydda OSM
                   3 = Basic OSM
                   4 = Esri World Imagery
                   
	https://rawgit.com/greghorne/TFD/master/index.html?baseLayer=3
#  
**Other examples:**

	https://rawgit.com/greghorne/TFD/master/index.html?recent=7&zoomTo=false&filter=Building
	https://rawgit.com/greghorne/TFD/master/index.html?recent=20&filter=Motor%20Vehicle,MVA&baseLayer=2

#

**Tech Stack:** Leaflet v1.3.3 & Javascript
#

**Data Source:**

	https://www.cityoftulsa.org/government/departments/information-technology/open-tulsa/open-tulsa-dataset-list/
	https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn
#
**Tested on macOS:** Chrome & Brave

#

**Notes/Comments:**

* Everything is executed client-side thus there is no web server.

* I do not have information on how/when the json file is updated on the server.  I have seen the JSON file update a couple of times in a few minutes to the other extreme where it didn't update for over an hour.  Please keep this in mind when viewing incidents on the map.  

* Code for using IndexedDB has been added to track all incidents although the data is currently not being used for any other purpose.

* JSON Data - Incidents.Incident[x].Vehicles.Vehicle - if 1 vehicle it is an object of key, value pairs; if greater than 1 is is an array of key, value pairs

* JSON Data - Incidents.Incident[x].Vehicles.Vehicle - if 1 vehicle it has been observed at times that VehicleID is null

**<p align="center">This is not a real-time map display.</p>**
**<p align="center">This webapp is for demonstration purposes.</p>**
