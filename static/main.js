// ts_svg = d3.select('#chart').append('svg');

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
	console.log(data);
	var width = 700,
	    height = 580,
	    mapRatioAdjuster = 85,
	    scale = width * (width / height + mapRatioAdjuster),//25,
	    nyc_center = [-74, 40.7];

	var svg = d3.select('#chart').append('svg')
	  .attr('viewBox', `0 0 ${width} ${height}`)
	  .attr('preserveAspectRatio', 'xMidYMid meet');

	


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