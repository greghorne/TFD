# TFD

Display Tulsa Fire Department incidents on a map.

* Tech Stack: Leaflet & Javascript

* Data Source: 

    https://www.cityoftulsa.org/government/departments/information-technology/open-tulsa/open-tulsa-dataset-list/

    https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn

* Tested on Chrome & Brave

* To execute: https://rawgit.com/greghorne/TFD/master/index.html

* Alternatively download and place index.html, tfd.js and tfd.css into the same folder and open index.html in a browser.


Notes/Comments:

* The webapp was written to minimize necessary files to execute and it not setup to run as a server.  Everything is executed client-side and CDN's were used.

* The webpage is polling the server every minute and is displaying the latest incident as a flashing icon and all other prior incidents onto the map.

* I do not have information on how/when the json file is updated on the server.  I have seen the JSON file update a couple of times in a few minutes to the other extreme when it didn't update for over and hour.  Please keep this in mind when viewing incidents on the map.

* I have added code for using IndexedDB that is currently keeping all incidents and is updated when a new JSON file is retrieved.  Currrently the DB is not being used for any purpose.  Maybe an additional feature later when I think of something.  JsStore might be a good library to use for interacting with IndexedDB.

This webapp is for demonstration purposes.



