# TFD

Display the latest Tulsa Fire Department incident on a map.

* Tech Stack: Leaflet & Javascript

* Test on Chrome, Brave, Safari, 

* To execute: https://rawgit.com/greghorne/TFD/master/index.html

* Alternatively place index.html, tfd.js and tfd.css into the same folder and open index.html in a browser.

* Currently I do not have information on how/when the json file is updated on the server.  The webpage is polling the server every minute and is displaying the latest incident on the map.

* I have added code for using indexedDB that is currently adding the latest incident from the polled json file to the DB.  Currrently the DB is not being used for any purpose.  Maybe an additional feature later when I think of something.


