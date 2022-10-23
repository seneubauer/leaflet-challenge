# leaflet-challenge

## Approach
In order to display the layers desired I had to nest two asynchronous JSON calls within each other. I'm unhappy with how the code is laid out but it works within the time frame available. Normally I'd perfer to store each JSON call inside its own method and pass the leaflet map into the method as an argument. That way each section is neatly separated from the others for code readability. I decided to create my own color scale with a method given the acquired earthquake depths. 

## Notes
The earthquake depths had a much greater range than anticipated, so the color scale was hard to automatically determine and have it still show a variety of colors. I ended up manually determining the max/min values for the color scale function so at least the earthquakes have somewhat appropriate color schemes.