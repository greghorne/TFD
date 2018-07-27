# TFD

Display Tulsa Fire Department incidents on a map.

* The Webapp:

    * Polls City of Tulsa Fire Department incident data every 1 minute.
    * The map will center and zoom to the most recent incident with a blinking red map marker and a popup with information.
    * The immediate 5 previous incidents prior to the current (blinkin) incident are displayed as yellow map markers.
    * All other incidents are represented as blue map markers.

* Tech Stack: Leaflet & Javascript

* Data Source: 

    * https://www.cityoftulsa.org/government/departments/information-technology/open-tulsa/open-tulsa-dataset-list/

    * https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn

* Tested on Chrome & Brave

* To execute: https://rawgit.com/greghorne/TFD/master/index.html

* Alternatively download and place **index.html**, **tfd.js** and **tfd.css** into the same folder and open index.html in a browser.


Notes/Comments:

* The webpage was written to minimize necessary files to execute and is not setup to run as a server.  Everything is executed client-side and CDN's are used.

* The webpage is polling the server every minute and is displaying the latest incident as a flashing icon and all other prior incidents onto the map.

* I do not have information on how/when the json file is updated on the server.  I have seen the JSON file update a couple of times in a few minutes to the other extreme when it didn't update for over and hour.  Please keep this in mind when viewing incidents on the map.

* I have added code for using IndexedDB that is currently keeping all incidents and is updated when a new JSON file is retrieved.  Currrently the DB is not being used.  Maybe an additional feature later when I think of something. 

<center>**This webpage is for demonstration purposes.**</center>



