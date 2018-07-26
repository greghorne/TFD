# TFD

Display Tulsa Fire Department incidents on a map.

* Tech Stack: Leaflet & Javascript

* Data Source: https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn

* Tested on Chrome & Brave

* To execute: https://rawgit.com/greghorne/TFD/master/index.html

* Alternatively download and place index.html, tfd.js and tfd.css into the same folder and open index.html in a browser.

Notes:
    
    * I do not have information on how/when the json file is updated on the server.  The webpage is polling the server every minute and is displaying the latest incident as a flashing icon and all other prior incidents onto the map.

    * I have added code for using indexedDB that is currently keeping all incidents and is updated when a new json files is retrieved.  Currrently the DB is not being used for any purpose.  Maybe an additional feature later when I think of something.


