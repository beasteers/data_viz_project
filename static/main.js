// ts_svg = d3.select('#chart').append('svg');

var width = 700,
    height = 2000;

// create responsive svg for moray plot
var svg = d3.select('#chart').append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .attr('preserveAspectRatio', 'xMidYMid meet');

var gMarey = svg.append('g');

var parseTime = d3.time.format("%I:%M:%S");

var line = d3.line()
    .x(function(d) { return x(parseTime(d.date)); })
    .y(function(d) { return y(d.close); });

var x = d3.scaleLinear()
    .rangeRound([0, width]);

var y = d3.scaleTime()
    .rangeRound([height, 0])
    .domain([parseTime('00:00:00'), parseTime('23:59:59')]);



// svg.append("defs").append("clipPath")
//     .attr("id", "clip")
//   .append("rect")
//     .attr("y", -margin.top)
//     .attr("width", width)
//     .attr("height", height + margin.top + margin.bottom);


function drawSubwayLabels(subway_lines) {
	var subway_lines = d3.select('#subway-line-labels').selectAll('.subway-line').data(subway_lines);

	subway_lines.enter()
		.append('div').attr('class', (d) => 'subway-line')
		.style('background-color', (d) => d.route_color ? '#'+d.route_color : null)
		.style('color', (d) => d.route_text_color ? '#'+d.route_text_color : null)
		.text(d => d.route_id)
		.on('click', function(d) {
			// toggle selected
			d3.select(this.parentNode).selectAll('.subway-line').classed('selected', false);
			d3.select(this).classed('selected', true);

			// display line details
			var details = d3.select('#line-details')

			// display line name
			var title = details.select('.title').text(d.route_long_name)
			title.append('span').text(' ('+d.route_short_name+')');
			title.append('a').attr('class', 'badge badge-pill badge-light')
				.attr('href', d.route_url).attr('target', '_blank').text('Timetable (pdf)');

			// display line description
			details.select('.description').text(d.route_desc);

			// draw graph
			drawStationTSDiagram(d);
		});
}

function drawStationTSDiagram(data) {
	y.domain(d3.extent(stations, function(d) { return d.distance; }));

	// Create axis

	var station = gMarey.selectAll("g")
		.data(stations)
		.enter().append("g")
		.attr("transform", function(d) { return "translate(0," + y(d.distance) + ")"; });

	station.append("text")
		.attr("x", -6)
		.attr("dy", ".35em")
		.text(function(d) { return d.name; });

	station.append("line")
		.attr("x2", width);

	svg.append("g")
	  .attr("class", "x top axis")
	  .call(xAxis.orient("top"));

	svg.append("g")
	  .attr("class", "x bottom axis")
	  .attr("transform", "translate(0," + height + ")")
	  .call(xAxis.orient("bottom"));

	var train = svg.append("g")
	  .attr("class", "train")
	  .attr("clip-path", "url(#clip)")
	  .selectAll("g")
		.data(data.lines)
		.enter().append("g")
		.attr("class", function(d) { return d.type; });

	train.append("path")
	  .attr("d", function(d) { return line(d.stops); });

	train.selectAll("circle")
	  .data(function(d) { return d.stops; })
	.enter().append("circle")
	  .attr("transform", function(d) { return "translate(" + x(d.time) + "," + y(d.station.distance) + ")"; })
	  .attr("r", 2);
}

function drawMap(geojson) {
	// http://codewritingcow.com/d3-js/maps/americas/united-states/new-york/new-york-city/
	var width = 700,
	    height = 580,
	    mapRatioAdjuster = 85,
	    scale = width * (width / height + mapRatioAdjuster),//25,
	    nyc_center = [-74, 40.7];

	var svg = d3.select('#chart')
	  .append('svg')
	  .attr('width', width)
	  .attr('height', height);

	var g = svg.append('g');

    // Create the geographic projection
    var projection = d3.geoMercator()
        .translate([width / 2, height / 2])
        .scale(scale).center(nyc_center);


	var geoPath = d3.geoPath()
	    .projection(projection);

	console.log(geojson.features);

	g.selectAll('path')
	  .data(geojson.features)
	  .enter()
	  .append('path')
	  .attr('stroke', '#000')
	  .attr('stroke-width', '3px')
	  .attr('fill', 'none')
	  .attr('d', geoPath);
}




function parseTime(s) {

  var t = formatTime.parse(s);
  if (t != null && t.getHours() < 3) t.setDate(t.getDate() + 1);
  return t;
}

