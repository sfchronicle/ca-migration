var d3 = require('d3');
var topojson = require('topojson');
var social = require("./lib/social");

// initialize colors
var lightest_gray = "#D8D8D8";

// helpful functions:
var formatthousands = d3.format("0,000");

// function for shading colors
function shadeColor2(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

// show year
var updateInfo = function(year) {
  document.querySelector(".info").innerHTML = `<strong>${year}</strong>`;
};

// we are not using a projection for the map
var path = d3.geo.path()
  .projection(null);

// show tooltip
var tooltip = d3.select("#county-map")
  .append("div")
  .attr("class","tooltip")
  // .attr("id","fed-tooltip")
  .style("position", "absolute")
  .style("z-index", "100")
  .style("visibility", "hidden");

// var mapname = "./assets/maps/ca_county_insets.json";
var mapname = "./assets/maps/bacounties_topo.json";

// defining the svg that we are using for the map
var svg = d3.select("#county-map")
  .append("div")
  .classed("svg-container", true) //container class to make it responsive
  .attr("id","county-map")
  .append("svg")
  //responsive SVG needs these 2 attributes and no width and height attr
  .attr("preserveAspectRatio", "xMinYMin slice")
  .attr("viewBox", "0 0 960 1000")
  //class to make it responsive
  .classed("svg-content-responsive", true)

// initialize the map
updateInfo("2011");
drawmap_initial(mapname,census2011);

// initialize the years
var years = [2011, 2012, 2013, 2014, 2015, 2016];
var i = 0;

// start looping through the years
var loop = null;
var tickTime = function() {
  drawmap(mapname,eval("census"+years[i]));
  updateInfo(years[i]);
  i = (i + 1) % years.length;
  loop = setTimeout(tickTime, i == 0 ? 2000 : 2000);
};
tickTime();
var looping = true;

// event listener for the drop down
var dropdown = document.querySelector("select");
// if user picks the year, we update the selected mode and stop looping
dropdown.addEventListener("change", function() {
  document.querySelector(".start").classList.remove("selected");
  document.querySelector(".pause").classList.add("selected");
  looping = false;
  clearTimeout(loop);
  drawmap(mapname,eval("census"+dropdown.value));
  updateInfo(dropdown.value);
});

// event listener for the play button
document.querySelector(".start").addEventListener("click", function(e) {
  if (looping) { return }
  document.querySelector(".start").classList.add("selected");
  document.querySelector(".pause").classList.remove("selected");
  looping = true;
  dropdown.value = "--";
  tickTime();
})
// event listener for the pause button
document.querySelector(".pause").addEventListener("click", function(e) {
  if (!looping) { return }
  document.querySelector(".start").classList.remove("selected");
  document.querySelector(".pause").classList.add("selected");
  looping = false;
  clearTimeout(loop);
})

// update map with new data
function drawmap(active_map,active_data) {

    d3.json(active_map, function(error, us) {
      if (error) throw error;
    //
      var nodes = svg.selectAll(".states")
        .data(topojson.feature(us, us.objects.features).features);
      nodes
        // .transition()
        // .ease("linear")
        // .duration(500)
        .style("fill", function(d) {
          var location = d.id;
          if (active_data[location]) {
            var mig = 1-Math.abs(active_data[location]["migration_percent"]/1.15);
            if (Math.abs(active_data[location]["migration_percent"]) <= 0.05) {
              return "#f2f2f2";
            } else if (active_data[location]["migration_percent"] > 0) {
              return shadeColor2("#265B9B", mig)
            } else {
              var mig = 1-Math.abs(active_data[location]["migration_percent"]/0.5);
              return shadeColor2("#BC1826", mig)
            }
          } else {
            return lightest_gray;
          }
        })
        .attr("d", path)
        .on('mouseover', function(d,index) {
          var location = d.id;
          if (active_data[location]) {
            var html_str = "<div class='name'>"+location+" County</div><div>Net migration: "+formatthousands(active_data[location]["migration"])+"</div><div>Total population: "+formatthousands(active_data[location]["population"])+"</div><div>Percentage of population migrating: "+formatthousands(active_data[location]["migration_percent"])+"%</div>";
            tooltip.html(html_str);
            tooltip.style("visibility", "visible");
          }
        })
        .on("mousemove", function() {
          if (screen.width <= 480) {
            return tooltip
              .style("top",(d3.event.pageY+10)+"px")//(d3.event.pageY+40)+"px")
              .style("left",((d3.event.pageX)/3+40)+"px");
          } else if (screen.width <= 670) {
            return tooltip
              .style("top",(d3.event.pageY+10)+"px")//(d3.event.pageY+40)+"px")
              .style("left",((d3.event.pageX)/2+50)+"px");
          } else {
            return tooltip
              .style("top", (d3.event.pageY+20)+"px")
              .style("left",(d3.event.pageX-80)+"px");
          }
        })
        .on("mouseout", function(){
          return tooltip.style("visibility", "hidden");
        });
  });

};

// initialize map
function drawmap_initial(active_map,active_data) {

    d3.json(active_map, function(error, us) {
      if (error) throw error;

      var features = topojson.feature(us,us.objects.features).features;
      var nodes = svg.selectAll(".states")
        .data(topojson.feature(us, us.objects.features).features);
      nodes.enter()
        .append("path")
        .attr("class", "states")
        .attr("d",path)
        .style("fill", function(d) {
          var location = d.id;
          if (active_data[location]) {
            var mig = 1-Math.abs(active_data[location]["migration_percent"]/1.15);
            if (Math.abs(active_data[location]["migration_percent"]) <= 0.05) {
              return "#f2f2f2";
            } else if (active_data[location]["migration_percent"] > 0) {
              return shadeColor2("#265B9B", mig)
            } else {
              var mig = 1-Math.abs(active_data[location]["migration_percent"]/0.5);
              return shadeColor2("#BC1826", mig)
            }
          } else {
            return lightest_gray;
          }
        })
        .attr("d", path)
        .on('mouseover', function(d,index) {
          var location = d.id;
          if (active_data[location]) {
            var html_str = "<div class='name'>"+location+" County</div><div>Total migration: "+formatthousands(active_data[location]["migration"])+"</div><div>Total population: "+formatthousands(active_data[location]["population"])+"</div><div>Percentage of population migrating: "+formatthousands(active_data[location]["migration_percent"])+"%</div>";
            tooltip.html(html_str);
            tooltip.style("visibility", "visible");
          }
        })
        .on("mousemove", function() {
          if (screen.width <= 480) {
            return tooltip
              .style("top",(d3.event.pageY+10)+"px")//(d3.event.pageY+40)+"px")
              .style("left",((d3.event.pageX)/3+40)+"px");
          } else if (screen.width <= 670) {
            return tooltip
              .style("top",(d3.event.pageY+10)+"px")//(d3.event.pageY+40)+"px")
              .style("left",((d3.event.pageX)/2+50)+"px");
          } else {
            return tooltip
              .style("top", (d3.event.pageY+20)+"px")
              .style("left",(d3.event.pageX-80)+"px");
          }
        })
        .on("mouseout", function(){
          return tooltip.style("visibility", "hidden");
        });

  });

};
