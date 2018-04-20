
var container = d3.select('#grid');

function drawStationLabels(stations) {
	var stations = container.select('#station-labels').selectAll('.station').data(stations);

	stations.enter()
		.append('div').attr('class', (d) => 'station '+d.color)
		.text(d => d.station)
		.on('click', function(d) {
			d3.select(this.parentNode).selectAll('.station').classed('selected', false);
			d3.select(this).classed('selected', true);
			renderStationTSDiagram(d.station);
		});
}

function renderStationTSDiagram(station_name) {
	// draw all the subway lines
}