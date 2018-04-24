ts_svg = d3.select('#chart').append('svg');

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
			renderStationTSDiagram(d);
		});
}

function renderStationTSDiagram(data) {
	console.log(data);
}