# TFD

Display Tulsa Fire Department incidents on a map.

* The Webapp:

    * Polls City of Tulsa Fire Department incident data every 1 minute.
    * The map will center and zoom to the most recent incident (blinking red map marker with an open popup).
    * The immediate 5 previous incidents prior to the current (blinking red) incident are displayed as yellow map markers.
    * All other older incidents are represented as blue map markers.
    * It is possible for a marker to end up directly on top of another marker when more than one incident has the same location.

* Tech Stack: Leaflet & Javascript

* Data Source: 

    * https://www.cityoftulsa.org/government/departments/information-technology/open-tulsa/open-tulsa-dataset-list/

    * https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn

* Tested on Chrome & Brave

* To execute: https://rawgit.com/greghorne/TFD/master/index.html

Notes/Comments:

* Everything is executed client-side thus there is no web server used.

* I do not have information on how/when the json file is updated on the server.  I have seen the JSON file update a couple of times in a few minutes to the other extreme where it didn't update for over an hour.  Please keep this in mind when viewing incidents on the map.

* I have added code for using IndexedDB that is currently keeping all incidents.  Currrently the DB is not being used.  Maybe an additional feature later when I think of something. 

**This webpage is for demonstration purposes.**



