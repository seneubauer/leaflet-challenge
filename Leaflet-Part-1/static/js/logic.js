// confirm logic.js is connected to index.html
console.log("logic.js is connected to index.html");



/* ----- global declarations ----- */

// data source
let data_source = {
    title: "Past 7 Days; All Earthquakes",
    source: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
};

// color scale
// let color_scale = [
//     { hue: 240, saturation: 100, luminosity: 35, udepth: 100, ldepth: 0 },
//     { hue: 243, saturation: 100, luminosity: 38, udepth: 200, ldepth: 100 },
//     { hue: 246, saturation: 100, luminosity: 41, udepth: 300, ldepth: 200 },
//     { hue: 249, saturation: 100, luminosity: 44, udepth: 400, ldepth: 300 },
//     { hue: 252, saturation: 100, luminosity: 47, udepth: 500, ldepth: 400 },
//     { hue: 255, saturation: 100, luminosity: 50, udepth: 600, ldepth: 500 },
//     { hue: 258, saturation: 100, luminosity: 53, udepth: 700, ldepth: 600 },
//     { hue: 261, saturation: 100, luminosity: 56, udepth: 800, ldepth: 700 },
//     { hue: 264, saturation: 100, luminosity: 59, udepth: 900, ldepth: 800 },
//     { hue: 267, saturation: 100, luminosity: 62, udepth: 1000, ldepth: 900 }
// ];



/* ----- page initialization ----- */
init();



/* ----- method definitions ----- */

// program initialization
function init()
{
    // construct the street layer
    let street_layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // construct the topographic layer
    let topo_layer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    // initialize the earthquake circle array
    let earthquake_circles = [];

    // retrieve the data
    d3.json(data_source.source).then(function (data)
    {
        // parse the relevant returned data into an array
        let earthquake_data = Object.values(data.features);

        // pull out the earthquake depth
        let earthquake_depths = [];
        for (let i = 0; i < earthquake_data.length; i++)
        {
            earthquake_depths.push(parseFloat(earthquake_data[i].geometry.coordinates[2]));
        }

        // get the color scale
        let color_scale = Build_Color_Scale(earthquake_depths, 15, max = 100, min = -10);

        // iterate through the array
        for (let i = 0; i < earthquake_data.length; i++)
        {
            let circle_color = Circle_Color_Calculator(earthquake_data[i].geometry.coordinates[2], color_scale);
            earthquake_circles.push(L.circle([earthquake_data[i].geometry.coordinates[1], earthquake_data[i].geometry.coordinates[0]], {
                fillOpacity: 0.75,
                color: circle_color,
                fillColor: circle_color,
                radius: Circle_Size_Calculator(earthquake_data[i].properties.mag)
            }).bindPopup(
                "<h1>Details</h1>" + 
                "<p>Magnitude: " + earthquake_data[i].properties.mag + "</p>" + 
                "<p>Depth: " + earthquake_data[i].geometry.coordinates[2] + "</p>" + 
                "<p>Intensity: " + earthquake_data[i].properties.cdi + "</p>" + 
                "<p>Latitude: " + earthquake_data[i].geometry.coordinates[1] + "</p>" + 
                "<p>Longitude: " + earthquake_data[i].geometry.coordinates[0] + "</p>"
            ));
        }

        // package the earthquake data into a layer group
        let earthquake_layer = L.layerGroup(earthquake_circles)

        // create the base layers object
        let baseMaps = {
            Street: street_layer,
            Topography: topo_layer
        };

        // create the overlay layers object
        let overlayMaps = {
            Earthquakes: earthquake_layer
        };

        // initialize and configure the leaflet map
        let leaflet_map = L.map("leaflet_map", {
            center: [39.833333, -98.583333],
            zoom: 5,
            layers: [street_layer, earthquake_layer]
        });

        // add the base and overlay layers
        L.control.layers(baseMaps, overlayMaps, { collapsed: true }).addTo(leaflet_map);

        // create the legend
        let legend = L.control({ position: "bottomright" });
        legend.onAdd = function() {
            let div = L.DomUtil.create("div", "info legend");
            let labels = [];

            // build the legend HTML structure
            let legend_info = "<h1>Earthquake Depth Color Scale</h1>" + 
                              "<div class=\"labels\">" + 
                                  "<div class=\"min\">" + color_scale[0].lower_depth.toFixed(2) + "</div>" +
                                  "<div class=\"max\">" + color_scale[color_scale.length - 1].upper_depth.toFixed(2) + "</div>" +
                              "</div>";

            // build the legend scale
            for (let i = 0; i < color_scale.length; i++)
            {
                labels.push("<li style=\"background-color: hsl(" + color_scale[i].hue + ", " + color_scale[i].saturation + "%, " + color_scale[i].luminosity + "%)\"></li>");
            }

            // assign the legend HTML
            div.innerHTML = legend_info + "<ul>" + labels.join("") + "</ul>";

            return div;
        };

        legend.addTo(leaflet_map);
    });
}

// convert earthquake magnitude to a circle size
function Circle_Size_Calculator(earthquake_magnitude)
{
    return Math.sqrt(Math.abs(earthquake_magnitude)) * 25000;
}

// convert earthquake depth to an HSL color representation
function Circle_Color_Calculator(earthquake_depth, color_scale)
{
    if (earthquake_depth > 1000)
    { 
        earthquake_depth = 1000;
    }
    else if (earthquake_depth < 0)
    {
        earthquake_depth = 0;
    }
    for (let i = 0; i < color_scale.length; i++)
    {
        if (earthquake_depth >= color_scale[i].lower_depth && earthquake_depth <= color_scale[i].upper_depth)
        {
            return `hsl(${color_scale[i].hue}, ${color_scale[i].saturation}%, ${color_scale[i].luminosity}%)`;
        }
    }
}

// construct the color scale
function Build_Color_Scale(earthquake_depths, target_size, max = 0.0, min = 1000.0)
{
    let output = [];
    if (max == 0.0)
    {
        for (let i = 0; i < earthquake_depths.length; i++)
        {
            if (max < earthquake_depths[i])
            {
                max = earthquake_depths[i];
            }
        }
    }
    if (min == 1000.0)
    {
        for (let i = 0; i < earthquake_depths.length; i++)
        {
            if (min > earthquake_depths[i])
            {
                min = earthquake_depths[i];
            }
        }
    }
    let total_span = max - min;
    let span = total_span / target_size;
    let lower = min;
    let upper = lower + span;
    for (let i = 0; i < target_size; i++)
    {
        let h = i * 360 / target_size;
        let s = 100;
        let l = 85 - i * 70 / target_size;
        output.push({ hue: h, saturation: s, luminosity: l, hsl: `hsl(${h}, ${s}%, ${l}%)`, upper_depth: upper, lower_depth: lower });
        lower = upper;
        upper = lower + span;
    }
    console.log(output);
    return output;
}