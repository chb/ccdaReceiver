var GC;
if (!GC) {
    GC = {};
}

(function () {
    "use strict";

    GC.chartSettings = {
        // the id of the div tag where the graphics will live
        divID: ("chart"),
        
        // dimensions for the drawing area (in pixels)
        width: 670,
        height: 500,
        
        // margins to be left around the main grid (for labels etc)
        leftgutter: 30, 
        rightgutter: 30,
        bottomgutter: 30,
        topgutter: 40,
        
        // internal padding within the drawing grid (used in the short term view)
        leftpadding: 40, 
        rightpadding: 40,
        
        // parameters for the graph's background grid
        gridRows: 20,  
        gridCols: 20,
        gridColor: "#333",
        
        // Styling definitions for the graph and labels
        colorS: "hsb(.6, .6, .7)",     // growth curve line color
        colorhueDefault: 0.9,          // default colorhue for datapoints when no percentile data is available
        txtLabel: {font: '10px Helvetica, Arial', fill: "#000"},  // Axis labels styling
        txtTitle: {font: '16px Helvetica, Arial', fill: "#000"},  // Title label styling
        
        // Axis definitions
        vLabels: 20,
        hLabels: 20,
        vAxisLabel: "cm",
        hAxisLabel: "age (months)",
        
        // Label for the chart
        graphLabel: "My Chart"
    };

}());
