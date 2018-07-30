# TFD

Display Tulsa Fire Department incidents on a map.

* The Webapp:

    * Polls City of Tulsa Fire Department incident data every 1 minute.
    * The map will center and zoom to the most recent incident (blinking red map marker).
    * The immediate 5 previous incidents prior to the most recent incident (blinking red) are displayed as blinking yellow map markers.
    * All other older incidents are represented as blue map markers.
    * It is possible for a marker to end up directly on top of another marker when more than one incident has occurred at the same location.

* Tech Stack: Leaflet & Javascript

* Data Source: 

    * https://www.cityoftulsa.org/government/departments/information-technology/open-tulsa/open-tulsa-dataset-list/

    * https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn

* Tested on Chrome & Brave

* To execute: https://rawgit.com/greghorne/TFD/master/index.html
    - There are 2 options that may be added to the URL as parameters to override default settings
    - recent=number - change the number of recent incidents displayed; valid values 1 through 10; default = 5
    - zoomTo=true or false - when false, turns off automatic panning and zoom to a new incident; default = true
    - example #1: https://rawgit.com/greghorne/TFD/master/index.html?recent=7
    - example #2: https://rawgit.com/greghorne/TFD/master/index.html?recent=7&zoomTo=false
    - example #3: https://rawgit.com/greghorne/TFD/master/index.html?zoomTo=false

Notes/Comments:

* Everything is executed client-side thus there is no web server.

* I do not have information on how/when the json file is updated on the server.  I have seen the JSON file update a couple of times in a few minutes to the other extreme where it didn't update for over an hour.  Please keep this in mind when viewing incidents on the map.  This is not a real-time map display.

* I have added code for using IndexedDB that is currently keeping all incidents.  Currrently the DB is not being used.  

**This webpage is for demonstration purposes.**



