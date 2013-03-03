// Initialize the BPC global obeject as needed
GC = window.GC || {};

(function () {
    "use strict";
    
    GC.drawGraph = function (){
        var papers = {};
        
        return function (divID, curvesData, points) {
        
            function findMinMax (arr, el) {
                var res = {min: arr[0][el], max: arr[0][el]};
                
                for (var i = 0; i<arr.length; i++) {
                    if (arr[i][el] < res.min) res.min = arr[i][el];
                    if (arr[i][el] > res.max) res.max = arr[i][el];
                }
                
                return res;
            }

            var s = GC.chartSettings,
                r = papers[divID],
                i, path,
                p = [],
                startX = s.leftgutter,
                endX = s.width - s.rightgutter,
                startY = s.topgutter,
                endY = s.height - s.bottomgutter,
                minX, maxX, minY, maxY;
                
                maxY = Math.round(findMinMax(curvesData[curvesData.length-1].data, "y").max * 1.05);
                minY = Math.round(findMinMax(curvesData[0].data, "y").min * 0.95);
                maxX = findMinMax(curvesData[0].data, "x").max;
                minX = findMinMax(curvesData[0].data, "x").min;

            
            if (!r) {
                r = Raphael(divID, s.width, s.height);
                papers[divID] = r;
            }
            
            r.clear();

            r.text((startX+endX)/2, startY - 15, s.graphLabel).attr(s.txtTitle).attr({"font-weight":"bold"}).toBack();
            r.drawGrid(s.leftgutter, s.topgutter, s.width - s.leftgutter - s.rightgutter, s.height - s.topgutter - s.bottomgutter, s.gridCols, s.gridRows, s.gridColor);
            r.drawVAxisLabels (s.leftgutter - 10, s.topgutter,s.height - s.topgutter - s.bottomgutter, s.vLabels, minY, maxY, s.vAxisLabel, s.txtLabel);
            r.drawHAxisLabels (s.leftgutter, s.height - s.bottomgutter, s.width - s.leftgutter - s.rightgutter, s.hLabels, minX, maxX, s.hAxisLabel, s.txtLabel);
            r.drawPAxisLabels (s.width - s.rightgutter + 10, curvesData, minY, maxY, startY, endY, s.txtLabel);

            for (var j = 0; j < curvesData.length; j++) {
                for (i = 0; i < curvesData[j].data.length; i++) {
                    var x = scale (curvesData[j].data[i].x, minX, maxX, startX, endX);
                    
                    var pathAdvance = function (first, x, y) { 
                        var path = [];
                        var y = scale (curvesData[j].data[i].y, minY, maxY, endY, startY);
                        s.height - s.bottomgutter - s.Y * y;
                        if (first) path = ["M", x, y];
                        path = path.concat(["L", x, y]);
                        return path;
                    };
                    
                    p = p.concat (pathAdvance (!i, x, curvesData[j].data[i].y));
                }

                if (p.length > 0) {
                    path = r.path().attr({stroke: s.colorS, "stroke-width": 2, "stroke-linejoin": "round"});
                    path.attr({path: p});
                }
            }
            
            for (var i = 0; i < points.length; i++) {
                var x = scale (points[i].agemos, minX, maxX, startX, endX);
                var y = scale (points[i].value, minY, maxY, endY, startY);
                r.circle(x, y, 3).attr({color: "rgb(0,0,0)", fill: "rgb(0,0,0)", stroke: "rgb(0,0,0)", "stroke-width": 1});
            }

        };
    }();

    Raphael.fn.drawGrid = function (x, y, w, h, wv, hv, color) {
        
        var path = ["M", Math.round(x), Math.round(y), "L", Math.round(x + w), Math.round(y), Math.round(x + w), Math.round(y + h), Math.round(x), Math.round(y + h), Math.round(x), Math.round(y)],
            rowHeight = h / hv,
            columnWidth = w / wv,
            i;
            
        color = color || "#000";   // default color to black
            
        for (i = 1; i < hv; i++) {
            path = path.concat(["M", Math.round(x), Math.round(y + i * rowHeight), "H", Math.round(x + w)]);
        }
        
        for (i = 1; i < wv; i++) {
            path = path.concat(["M", Math.round(x + i * columnWidth), Math.round(y), "V", Math.round(y + h)]);
        }
        
        return this.path(path.join(",")).attr({stroke: color, "stroke-width": .5}).toBack();
    };

    Raphael.fn.drawVAxisLabels = function (x, y, h, hv, minVal, maxVal, axisLabel, styling) {
    
        var stepDelta = h / hv,
            stepGamma = (maxVal - minVal) / hv,
            label,
            i;

        for (i = 0; i <= hv; i++) {
            label = Math.round(maxVal - i*stepGamma);
            this.text(x - 5, y + i * stepDelta, label).attr(styling).toBack();
        }
        
        this.text(x - 5, y - 18, axisLabel).attr(styling).attr({"font-weight":"bold"}).toBack();
    };

    Raphael.fn.drawHAxisLabels = function (x, y, w, wv, minVal, maxVal, axisLabel, styling) {
    
        var stepDelta = w / wv,
            stepGamma = (maxVal - minVal) / wv,
            label,
            i;
            
        for (i = 0; i <= wv; i++) {
            label = Math.round(minVal + i*stepGamma);
            this.text(Math.round(x + i * stepDelta), y + 10, label).attr(styling).toBack();
        }
        
        this.text(x + w - 30, y + 25, axisLabel).attr(styling).attr({"font-weight":"bold"}).toBack();
    };
    
    Raphael.fn.drawPAxisLabels = function (x, data, minY, maxY, startY, endY, styling) {
        var i, y, label, points;
    
        for (var i = 0; i < data.length; i++) {
            points = data[i].data;
            y = scale (points[points.length-1].y, minY, maxY, endY, startY);
            label = data[i].label;
            this.text(x + 5, y, label).attr(styling).toBack();
        }
        
    };
    
    var scale = function (X, x1, x2, y1, y2) {
        var a, b;
        
        if (x1 === x2) {
            return y1 + (y2-y1)/2;
        }
        
        a = (y2-y1)/(x2-x1);
        b = y1 - a*x1;
        
        return a*X + b;
    };
   
}());