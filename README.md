# TFD

Display Tulsa Fire Department incidents on a map.

* What does it do:

    * Polls City of Tulsa Fire Department incident data every 1 minute.
    * The map will center and zoom to the most recent incident (red map marker).
    * The 10 previous incidents are displayed as yellow map markers.
    * All other incidents are displayed as blue map markers.
    * It is possible for a marker to end up directly on top of another marker when more than one incident has occurred at the same location.

* To execute: https://rawgit.com/greghorne/TFD/master/index.html

#

There are 4 options that may be added to the URL as parameters to override default settings

    _recent=number_ - change the number of recent incidents displayed (yellow markers); valid values are 1 through 20; default = 10
    example: https://rawgit.com/greghorne/TFD/master/index.html?recent=7

    _zoomTo=false_ - when false, turns off automatic panning and zoom to a new incident; default = true
    example: https://rawgit.com/greghorne/TFD/master/index.html?zoomTo=false

    _filter=Motor Vehicle_  - comma dlimited keywords/phrases to filter incidents; keywords are not case sensitive ex. Fire = fire
    example: https://rawgit.com/greghorne/TFD/master/index.html?filter=Fire
    example: https://rawgit.com/greghorne/TFD/master/index.html?filter=Fire,Motor

    _baseLayer=1_  - defines which map to display, 0 = Grayscale (default), 1 = Esri, 2 = Hydda, 3 = Standar OSM, 4 = Esri World Imagery
    example: https://rawgit.com/greghorne/TFD/master/index.html?baseLayer=3
    
    _other examples_:
    example: https://rawgit.com/greghorne/TFD/master/index.html?recent=7&zoomTo=false&filter=Building
    example: https://rawgit.com/greghorne/TFD/master/index.html?recent=20&filter=Motor%20Vehicle,MVA&baseLayer=2

#

Tech Stack: Leaflet & Javascript

Data Source: 

    https://www.cityoftulsa.org/government/departments/information-technology/open-tulsa/open-tulsa-dataset-list/
    https://www.cityoftulsa.org/apps/opendata/tfd_dispatch.jsn

Tested on macOS: Chrome & Brave

#

Notes/Comments:

* Everything is executed client-side thus there is no web server.

* I do not have information on how/when the json file is updated on the server.  I have seen the JSON file update a couple of times in a few minutes to the other extreme where it didn't update for over an hour.  Please keep this in mind when viewing incidents on the map.  _This is not a real-time map display_.

* I have added code for using IndexedDB that is currently keeping all incidents.  Currrently the DB is not being used.  

**This webpage is for demonstration purposes.**






