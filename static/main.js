// ts_svg = d3.select('#chart').append('svg');

var width = 900, // determines the overall scale of everything. the width will always just fill the available space
    mapAspectRatio = 1, 
    mareyAspectRatio = 1 / 5, // width / height
    margin = {top: 250, left: 60, right: 60, bottom: 10}, // defines how much space to give for axes
    height = width / mareyAspectRatio;
    mapHeight = width / mapAspectRatio;

// var map = new L.Map("map", {center: [37.8, -96.9], zoom: 4})
//     .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

// var svgMap = d3.select(map.getPanes().overlayPane).append("svg"),
//     g = svgMap.append("g").attr("class", "leaflet-zoom-hide");


// create responsive svg for moray plots and map
var svgMap = d3.select('#map .wrap').append('svg').call(responsiveSvg, {width: width, aspectRatio: mapAspectRatio});
var svgMareys = d3.selectAll('.marey').append('svg').call(responsiveSvg, {width: width, aspectRatio: mareyAspectRatio});

svgMareys.append('g').attr('class', 'station-axis').attr("transform", `translate(0,${margin.top})`);
svgMareys.append('g').attr('class', 'lines');

var formatTime = d3.timeFormat("%H:%M");
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

var svgMapLines = svgMap.append('g').attr('class', 'g-line');
var svgMapStations = svgMap.append('g').attr('class', 'g-station');

var lineTooltip = d3.select('body').append('div').attr('class', 'subway-line line-tooltip');

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

	// come out of hiding
	d3.select(svg.node().parentNode).classed('d-none', false);

	// select map stations
	updateMapColors();

	// Create axis
	var station = svg.select('.station-axis').selectAll('.station').data(stations);
		
		
	var station_enter = station.enter().append('g').attr('class', 'station')

	station_enter
		.attr("transform", (d) => `translate(${width - margin.right},0)`)
		.on('mouseover', function(){
			var data = d3.select(this).datum();
			d3.selectAll('#map .map-station')
				.filter(function(d){return d.stop_name == data.stop_name; })
				.classed('hover', true).moveToFront()
				.transition().duration(300)
				.attr('r', '8px');

			d3.select(this).classed('hover', true);
			d3.select(this.previousElementSibling).classed('hidden', true);
			d3.select(this.nextElementSibling).classed('hidden', true);

		})
		.on('mouseout', function(){
			d3.selectAll('#map .map-station').classed('hover', false)
				.transition().duration(300)
				.attr('r', '5px');
			
			d3.select(this).classed('hover', false);
			d3.select(this.previousElementSibling).classed('hidden', false);
			d3.select(this.nextElementSibling).classed('hidden', false);
		})
		.transition().duration(300)
		.attr("transform", (d) => `translate(${x(d.distance)},0)`);

	station.transition().duration(300)
		.attr("transform", (d) => `translate(${x(d.distance)},0)`);
		

	// draw circles
	var g = station_enter.append("g").attr('class', 'station-label');

	g.append("text")
		.attr("x", -6)
		.attr("dy", ".35em")
		.text((d) => d.stop_name);

	// g.selectAll("circle").data((d) => d.lines)
	// 	.enter().append("circle")
	// 	.data(function(d) {
	// 		var that = this;
	// 		return d.lines.map(function(route_id){
	// 			var bbox = d3.select(that.parentNode)
	// 				.select('text').node()
	// 				.getBoundingClientRect();

	// 			return {
	// 				route_id: route_id,
	// 				y: bbox.height / 2,
	// 				offset: bbox.width
	// 			}
	// 		});
	// 	})
	// 	.attr("r", 3)
	// 	.attr("cx", function(d,i) {return 5 + d.offset + i*3*3;})
	// 	.attr("cy", function(d,i) {return d.y;})
	// 	.attr("fill", function(d) {return line_colors[d.route_id] ? '#' + line_colors[d.route_id] : null})
	// 	// .attr('stroke', 'white')
	// 	.text((d) => d.route_id);

	g.attr("transform", 'translate(0,-20)rotate(-75)');

	station_enter.append("line")
		.attr("y2", height - margin.top - margin.bottom);

	station.enter.append('rect')
		.attr('x', 0).attr('y', 0)
		.attr('height', height - margin.top - margin.bottom)
		.attr('width', function(d1){
			var d2 = d3.select(this.nextElementSibling).datum();
			if(!d2) return;
			return y(d2.distance) - y(d1.distance);
		})

	station.exit().remove();

	svg.append("g")
	  .attr("class", "y left axis")
	  .attr('transform', `translate(${margin.left},0)`)
	  .call(yAxis);


	//draw lines
	var line = d3.line()
	.curve(d3.curveBasis)
		.x(function(d) {return x(d.distance);})
		.y(function(d) {return y(parseTime(d.departure_time));})
	
	var lines = svg.select('.lines').selectAll(".trip").data(trips);

	lines.enter().append("path").attr("class", "trip")
		.attr("d", line)
		.attr("stroke", "white")
		.attr('fill', 'none')
		.attr('stroke-width', 4)
		.style('opacity', 0.4);

	lines.exit().remove();

	lines
		.transition().duration(300)
		.attr("d", line)
		.attr("stroke", "white");


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
	var path = d3.geoPath().projection(projection)
		.pointRadius(2);

	// draw trips
	var lines = svgMapLines.datum(geojson || svgMapLines.datum()).selectAll('.line')
	  	.data((d) => d.features);
	console.log(lineTooltip)
	lines.enter()
	  .append('path').attr('class', 'line')
	  .attr('stroke', (d) => d.properties.route_color ? '#'+d.properties.route_color : '#666')
	  .attr('d', path)
	  // add a tooltip
	  .call(bindTooltip, lineTooltip)
	  .on('mouseover.modify_tooltip', function(d) {
	  	lineTooltip.text(d.properties.train)
	  		.style('background-color', d.properties.route_color ? '#'+d.properties.route_color : '#666');
	  })

	lines
		.attr('d', path);

  // draw stations here
  var stationPoints = svgMapStations.selectAll('.map-station')

  stationPoints.data(stations.features || stationPoints.data())
	.enter().append("path").attr('class', 'map-station')
	.attr("r", "5px")
	.attr('d', path)
	.on('mouseover', function(data){
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
	var path = d3.geoPath().projection(projection)
		.pointRadius(2);

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
	var map_lines = svgMapLines.selectAll('.line');
	
	var is_focused = (d) => route_ids.includes(d.properties.train) || show_all;

	map_stations.transition().duration(300).attr('stroke', 'white').attr('stroke-width', 1)
		.attr('fill', function(d) { return is_focused(d) ? 'white' : 'lightgrey'; })
		.attr('r', (d) => show_all ? '3' : (is_focused(d) ? '10' : '2' ))
		.style('opacity', (d) => is_focused(d) ? 1 : 0.2);

	map_lines.transition().duration(300)
		.attr('stroke', function(d) { return lineColor(d); })
		.attr('stroke-width', (d) => show_all ? '3' : (is_focused(d) ? '6' : '2' ))
		.style('opacity', (d) => is_focused(d) ? 1 : 0.1);

	if(!show_all){
		map_stations.filter(is_focused).moveToFront();
		map_lines.filter(is_focused).moveToFront();
	}
}


function bindTooltip(el, tooltip, o) {
	o = Object.assign({
		left: (box) => - box.width / 2,
		top: (box) =>  - box.height - 8,
		updateOn: 'mousemove'
	}, o);

	tooltip.classed('d3-tooltip', true);
	el.on('mouseover.tooltip_show', function(){
		tooltip.classed('tooltip-show', true);
	})
	.on(`${o.updateOn}.tooltip_move`, function(){
		var bb = tooltip.node().getBoundingClientRect();
		tooltip
			.style('left', (d3.event.pageX + o.left(bb)) + 'px')
			.style('top', (d3.event.pageY + o.top(bb)) + 'px');
	})
	.on('mouseout.tooltip_hide', function(){
		tooltip.classed('tooltip-show', false);
	});
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