# TFD

Display Tulsa Fire Department incidents on a map.

* The Webapp:

    * Polls City of Tulsa Fire Department incident data every 1 minute.
    * The map will center and zoom to the most recent incident with a blinking blue map marker and a popup with information.
    * The previous prior 3 incidents are also noticable as blue markers that blink at a slower rate.
    * In certain cases, it is possible for a marker to "hide" on top of a different marker when incident addresses are the same.  For example, a marker is placed at a location.  Subsequently another marker is placed at the same location and is blinking.  The blinking effect will not be noticeable.
    * The data is updated on the map as it becomes available from the City of Tulsa web server.

* Tech Stack: Leaflet & Javascript

* Data Source: 

    * https://www.cityoftulsa.org/government/departments/information-technology/open-tulsa/open-tulsa-dataset-list/

    * https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn

* Tested on Chrome & Brave

* To execute: https://rawgit.com/greghorne/TFD/master/index.html

* Alternatively download and place **index.html**, **tfd.js** and **tfd.css** into the same folder and open index.html in a browser.


Notes/Comments:

* I attempted to use different colored markers on the map but ran into some technical issue thus they are all the same blue markers.  I will revisit this issue.

* The webpage was written to minimize necessary files to execute and is not setup to run as a server.  Everything is executed client-side and CDN's are used.

* The webpage is polling the server every minute and is displaying the latest incident as a flashing icon and all other prior incidents onto the map.

* I do not have information on how/when the json file is updated on the server.  I have seen the JSON file update a couple of times in a few minutes to the other extreme when it didn't update for over and hour.  Please keep this in mind when viewing incidents on the map.

* I have added code for using IndexedDB that is currently keeping all incidents and is updated when a new JSON file is retrieved.  Currrently the DB is not being used.  Maybe an additional feature later when I think of something. 

**This webpage is for demonstration purposes.**



