# TFD   

**Display City of Tulsa Fire Department incidents on a map.**

* **What does it do?**

    * Polls City of Tulsa Fire Department incident data every 1 minute.
    * The map will center and zoom to the newest incident and display as a red map marker. 
    * The 10 previous incidents are displayed as yellow map markers.
    * All older incidents are displayed as blue map markers.
    * The list of incidents found on the lower right of the map are clickable.
    * It is possible for a marker to end up directly on top of another marker when more than one incident has occurred at the same location.
    
    * Heat Map Creation is under development.

    * For Heat Map functionality please use Chrome.  Other browsers are currently not being tested during development.

#

| Map Marker Incident | Icon          |
|:-------------:|:-------------:|
| Newest | ![Alt text](http://tfdincidents.s3-website-us-west-2.amazonaws.com/images/marker-icon-red.png "Current Incident") |
| Recent | ![Alt text](http://tfdincidents.s3-website-us-west-2.amazonaws.com/images/marker-icon-yellow.png "Recent Incident") |
| Older | ![Alt text](http://tfdincidents.s3-website-us-west-2.amazonaws.com/images/marker-icon-blue.png "Older Incident") |

#
**Deployment:** http://tfdincidents.s3-website-us-west-2.amazonaws.com?baseLayer=1

#

**There are 4 options that may be added to the URL as parameters to override default settings**

**1) recent=number** - change the number of recent incidents (yellow markers) displayed; valid values are 1 thru 20; default=10

	http://tfdincidents.s3-website-us-west-2.amazonaws.com/index.html?recent=7
#
**2) zoomTo=boolean** - when false, turns off automatic panning and zoom to a new incident; default=true

	http://tfdincidents.s3-website-us-west-2.amazonaws.com/index.html?zoomTo=false
#
**3) filter=text** - comma delimited keywords/phrases to filter incidents; keywords are not case sensitive; do not add unnecessary spaces/blanks and no spaces/blanks next to commas

	http://tfdincidents.s3-website-us-west-2.amazonaws.com/index.html?filter=Fire

	http://tfdincidents.s3-website-us-west-2.amazonaws.com/index.html?filter=fire,Odor,Motor%20Vehicle

    For a phrase like 'Motor Vehicle' you will have to manually enter the equivalent of a space in the url string between 'Motor' and 'Vehicle.  A space is equal to %20
#
**4) baseLayer=number** - defines which base map to display on startup

                   0 = Grayscale OSM (default)
                   1 = Esri OSM
                   2 = Hydda OSM
                   3 = Basic OSM
                   4 = Esri World Imagery
                   
	http://tfdincidents.s3-website-us-west-2.amazonaws.com/index.html?baseLayer=3
#  
**Other examples:**

	http://tfdincidents.s3-website-us-west-2.amazonaws.com/index.html?recent=7&zoomTo=false&filter=Building
	http://tfdincidents.s3-website-us-west-2.amazonaws.com/index.html?recent=20&filter=Motor%20Vehicle,MVA&baseLayer=2

#

**Tech Stack:** Leaflet v1.3.3 & Javascript
#

**Data Source:**

	https://www.cityoftulsa.org/government/departments/information-technology/open-tulsa/open-tulsa-dataset-list/
	https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn
#
**Tested on macOS & Windows 10:** 

    Chrome, Brave, Edge 
    Opera   - Dev Console indexedDB not displaying any data (macOS only)
            - Will not display Grayscale map layer (Win10 only)
    Firefox - Dev Console indexedDB "No data present for selected host" (macOS only)


#

**Notes/Comments:**

* Everything is executed client-side thus there is no web server.

* I do not have information on how/when the json file is updated on the server.  I have seen the JSON file update a couple of times in a few minutes to the other extreme where it didn't update for over an hour.  Please keep this in mind when viewing incidents on the map.  

* As incidents become available, the data is added to IndexedDB.  Subsequently the creation of heat maps uses data available in IndexedDB.

* JSON Data - Incidents.Incident[x].Vehicles.Vehicle - if 1 vehicle it is an object of key, value pairs; if greater than 1 it is an array of key, value pairs

* JSON Data - Incidents.Incident[x].Vehicles.Vehicle - if 1 vehicle it has been observed at times that VehicleID is null

#

**<p align="center">This is not a real-time map display.</p>**
**<p align="center">This webapp is for demonstration purposes.</p>**
