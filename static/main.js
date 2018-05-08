// ts_svg = d3.select('#chart').append('svg');

var width = 900, // determines the overall scale of everything. the width will always just fill the available space
    mapAspectRatio = 1, 
    mareyAspectRatio = 1 / 3, // width / height
    margin = {top: 250, left: 60, right: 120, bottom: 10}, // defines how much space to give for axes
    height = width / mareyAspectRatio;
    mapHeight = width / mapAspectRatio;

// var map = new L.Map("map", {center: [37.8, -96.9], zoom: 4})
//     .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

// var svgMap = d3.select(map.getPanes().overlayPane).append("svg"),
//     g = svgMap.append("g").attr("class", "leaflet-zoom-hide");


// create responsive svg for moray plots and map
var svgMap = d3.select('#map .wrap').append('svg').call(responsiveSvg, {width: width, aspectRatio: mapAspectRatio});
var svgMareys = d3.selectAll('.marey').append('svg').call(responsiveSvg, {width: width, aspectRatio: mareyAspectRatio});

svgMareys.append('g').attr('class', 'station-axis');

var formatTime = d3.timeFormat("%H:%M:%S");
var parseTime = d3.timeParse("%H:%M:%S");


var mareys = svgMareys.nodes();
function oldestMarey(){
	/* keep track of the order of marey diagrams 
		mareys is a list of svg nodes ordered by how recent it was used, in descending order
		the last element is next */
	mareys.unshift(mareys.pop()); // move from end to front
	return d3.select(mareys[0]);
}

// Map

var svgMapStations = svgMap.append('g'),
	svgMapLines = svgMap.append('g');

// Marey Plots

var line = d3.line()
	.curve(d3.curveBasis)
    .x(function(d) { return x(parseTime(d.date)); })
    .y(function(d) { return y(d.close); });

var x = d3.scaleLinear()
    .rangeRound([margin.left, width - margin.right]);

var y = d3.scaleTime()
    .rangeRound([margin.top, height - margin.bottom])
    .domain([parseTime('00:00:00'), parseTime('23:59:59')]);

var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(24)
    .tickFormat(formatTime);


var iconBar = d3.selectAll('.marey').append('div').attr('class', 'diagram-icons');

// create the line label
iconBar.append('span').attr('class', 'subway-line marey-line');

// create full-size icon
iconBar.append('span').attr('class', 'ctl-button subway-line')
	.on('click', function(){
		var that = d3.select(this).closest('.col').node(); // select the parent column
		// select columns other than this one and that have data attached and toggle displaying them
		d3.selectAll('#vis .panels .col')
			.filter(function(){ 
				var el = d3.select(this);
				return el.attr('id') == 'map' || (this != that && el.select('svg').datum()); 
			})
			.classed('d-none', function (d, i) { return !d3.select(this).classed('d-none'); });


	})
	.append('i').attr('class', 'fa fa-expand')


// create a close button for marey diagrams
iconBar.append('span').attr('class', 'ctl-button subway-line hiding').html('&times;')
	.on('click', function(d, i){ 
		
		var col = d3.select(this).closest('.col');
		var svg = col.select('svg');

		// close marey diagram and deselect the line icon
		var station = svg.datum();
		d3.select('#subway-line-labels').selectAll('.subway-line')
			.filter((d) => d.route_id == station.route_id)
			.classed('selected', false);

		// undo full screen
		d3.selectAll('#vis .panels .col')
			.filter(function(){ return d3.select(this).select('svg').datum(); })
			.classed('d-none', false);

		// push svg to front of the line
		mareys.push(mareys.splice(i,1)[0]);

		// clear svg data and update colors
		svg.datum(null);
		updateMapColors();
		zoomMapTo();

		// hide column
		col.classed('d-none', true);
	});


// // cipping path for lines so they don't show outside of the plot. idk I found it in the marey example
// svgMareys.append("defs").append("clipPath")
//     .attr("id", "clip")
//   .append("rect")
//   	.attr("x", -margin.left)
//     .attr("y", -margin.top)
//     .attr("width", width - margin.left - margin.right)
//     .attr("height", height - margin.top - margin.bottom);


function drawSubwayLabels(subway_lines) {
	var subway_lines = d3.select('#subway-line-labels').selectAll('.subway-line').data(subway_lines);

	subway_lines.enter()
		.append('div').attr('class', (d) => 'subway-line')
		.style('background-color', (d) => d.route_color ? '#'+d.route_color : null)
		.style('color', (d) => d.route_text_color ? '#'+d.route_text_color : null)
		.text(d => d.route_id)
		.on('click', function(d) {

			var svg = svgMareys.filter((s) => s && s.route_id == d.route_id);
			//preventing train duplicating
			if (!svg.empty()){
				var close_button = svg.closest('.col').select('.hiding')
				close_button.on('click').apply(close_button.node());
				return;
			}
			var svg = oldestMarey();
			var station = svg.datum() || {};

			// toggle selected
			d3.select('#subway-line-labels').selectAll('.subway-line')
				.filter((d) => d.route_id == station.route_id)
				.classed('selected', false);
			d3.select(this).classed('selected', true);

			// // display line details
			// var details = d3.select('#line-details')

			// // display line name
			// var title = details.select('.title').text(d.route_long_name)
			// title.append('span').text(' ('+d.route_short_name+')');
			// title.append('a').attr('class', 'badge badge-pill badge-dark')
			// 	.attr('href', d.route_url).attr('target', '_blank').text('Timetable (pdf)');

			// // display line description
			// details.select('.description').text(d.route_desc);
			// set marey plot line label
			svg.closest('.col').select('.marey-line').text(d.route_id)
				.style('background-color', d.route_color ? '#'+d.route_color : null)
				.style('color', d.route_text_color ? '#'+d.route_text_color : null)


			// draw graph
			loadMareyDiagram(d, svg.datum(d));
			zoomMapTo();
		});
}

function loadMareyDiagram(line, svg) {
		d3.json(`/data/trips/${line.route_id}`, function(err, d){
			drawMareyDiagram(d.stations, d.trips, svg);
		});
}

function drawMareyDiagram(stations, trips, svg) {
	x.domain(d3.extent(stations, (d) => d.distance));
	console.log(5555, stations, trips);

	// come out of hiding
	d3.select(svg.node().parentNode).classed('d-none', false);

	// select map stations
	updateMapColors();

	// Create axis
	var station = svg.select('.station-axis').selectAll('.station')
		.data(stations, (d) => d.stop_id);
		
		
	var station_enter = station.enter().append('g').attr('class', 'station')

	station_enter
		.attr("transform", `translate(0,${margin.top})`)
		.on('mouseover', function(){
			var data = d3.select(this).datum();
			d3.selectAll('#map .map-station')
				.filter(function(d){return d.stop_name == data.stop_name; })
				.classed('hover', true).moveToFront()
				.transition().duration(300)
				.attr('r', '8px');

			d3.select(this).classed('hover', true);
		})
		.on('mouseout', function(){
			d3.selectAll('#map .map-station').classed('hover', false)
				.transition().duration(300)
				.attr('r', '5px');
			
			d3.select(this).classed('hover', false);
		})
		.transition().duration(300)
		.attr("transform", (d) => `translate(${x(d.distance)},${margin.top})`);
		

	station_enter.append("text")
		.attr("x", -6)
		.attr("dy", ".35em")
		.attr("transform", 'translate(0,-20)rotate(-60)')
		.text((d) => d.stop_name);

	station_enter.append("line")
		.attr("y2", height - margin.top - margin.bottom);

	station.exit().remove();

	svg.append("g")
	  .attr("class", "y left axis")
	  .attr('transform', `translate(${margin.left},0)`)
	  .call(yAxis);

	// https://bl.ocks.org/mbostock/5544008

	// var train = svg.append("g")
	//   .attr("class", "train")
	//   .attr("clip-path", "url(#clip)")
	//   .selectAll("g")
	// 	.data(data.lines)
	// 	.enter().append("g")
	// 	.attr("class", function(d) { return d.type; });

	// train.append("path")
	//   .attr("d", function(d) { return line(d.stops); });


	// draw trip paths here
	var route_id = svg.datum().route_id;
	d3.selectAll('.map-station').filter((d) => d.properties.lines.includes(route_id)).moveToFront();
}



function drawMap(geojson, stations, line) {
	// http://codewritingcow.com/d3-js/maps/americas/united-states/new-york/new-york-city/

	// d3+leaflet https://bost.ocks.org/mike/leaflet/

	var mapRatioAdjuster = 100,
	    scale = width*(mapAspectRatio + mapRatioAdjuster), //width * (width / height + mapRatioAdjuster),
	    nyc_center = [-74, 40.7];


    // Set geographic projection
    var projection = d3.geoMercator()
    	.translate([width / 2, (width / mapAspectRatio) / 2])
    	.scale(scale).center(nyc_center);

    // create line generator
	var path = d3.geoPath().projection(projection);

	// draw trips
	var lines = svgMapLines.datum(geojson || svgMapLines.datum()).selectAll('.line')
	  	.data((d) => d.features);

	lines.enter()
	  .append('path').attr('class', 'line')
	  .attr('stroke', (d) => d.route_color ? '#'+d.route_color : null)
	  .attr('stroke-width', '1px')
	  .attr('fill', 'none')
	  .attr('d', path);

	lines
		.attr('d', path);

  // draw stations here
  var stationPoints = svgMapStations.selectAll('.map-station')

  stationPoints.data(stations.features || stationPoints.data())
	.enter().append("path").attr('class', 'map-station')
	.attr("r", "5px")
	.attr('d', path)
	.on('mouseover', function(){
		var data = d3.select(this).datum();
		d3.select(this).classed('hover', true).moveToFront()
			.transition().duration(300)
			.attr('r', '8px');

		d3.selectAll('.marey .station')
			.filter(function(d){return d.stop_name == data.stop_name; })
			.classed('hover', true);
	})
	.on('mouseout', function(){
		d3.select(this).classed('hover', false)
			.transition().duration(300)
			.attr('r', '5px');
		
		d3.selectAll('.marey .station').classed('hover', false);
	});

	updateMapColors();
	zoomMapTo(line);


}

function zoomMapTo(line, features) {
	var route_ids = svgMareys.data().map((d) => d ? d.route_id : null).filter((d)=>d);

	features = features || []; // prevent attribute error
	// use specified features, default to features defined by line
	features = features.length ? features : svgMapStations.selectAll('.map-station').filter((d) => d.properties.train == line ).data();
	// if neither of those work, default to only visible lines (lines in marey)
	features = features.length ? features : svgMapStations.selectAll('.map-station').filter((d) => route_ids.includes(d.properties.train) ).data();
	// otherwise, just select all
	features = features.length ? features : svgMapStations.selectAll('.map-station').data();
	console.log(line, route_ids, features);
	if(!features.length) return;

    
    // Set geographic projection
    var projection = d3.geoMercator()
    	.translate([width / 2, (width / mapAspectRatio) / 2])
    	.fitSize([width, mapHeight], {
		type: 'FeatureCollection',
		features: features
	});

    // create line generator
	var path = d3.geoPath().projection(projection);

    svgMapLines.selectAll('.line')
    	.transition().duration(600)
    	.attr('d', path);

    svgMapStations.selectAll('.map-station')
    	.transition().duration(600)
    	.attr('d', path);
}


function responsiveSvg(el, o){
	o = Object.assign({
		width: 100, height: null, aspectRatio: 1
	}, o);

	o.height = o.height || o.width / o.aspectRatio;
	el.attr('viewBox', `0 0 ${o.width} ${o.height}`)
	  .attr('preserveAspectRatio', 'xMidYMid meet')
}


function lineColor(d, def) {
	return line_colors[d.properties.train] ? '#' + line_colors[d.properties.train] : (def || 'black');
}

function updateMapColors(){
	var route_ids = svgMareys.data().map((d) => d ? d.route_id : null).filter((d)=>d);
	var show_all = !route_ids.length; // if no svgs are selected show all colors
	var map_stations = svgMapStations.selectAll('.map-station');
	
	var is_focused = (d) => route_ids.includes(d.properties.train) || show_all;

	map_stations.transition().duration(300).attr('stroke', 'white').attr('stroke-width', 1)
		.attr('fill', function(d) { return is_focused(d) ? 'white' : 'lightgrey'; })
		.attr('r', (d) => show_all ? '5' : (is_focused(d) ? '10' : '3' ))
		.style('opacity', (d) => is_focused(d) ? 1 : 0.5);

	if(!show_all)
		map_stations.filter(is_focused).moveToFront();
}


function throttle(fn, restPeriod){ 
	// only fire a function every so often
	var free = true;
	return function(){
		if (free){
			fn.apply(this, arguments);
			free = false;
			setTimeout((d) => { free = true; }, restPeriod);
		}
	}
}