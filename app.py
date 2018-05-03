import numpy as np
import pandas as pd
from flask import Flask
from flask import request, render_template, jsonify, make_response

app = Flask(__name__)



def load_map_geojson():
	# load map data
	map_data = pd.read_csv('static/data/GTFS_nyc_Subway/shapes.txt').set_index(['shape_id', 'shape_pt_sequence']).drop('shape_dist_traveled', 1).dropna()

	# convert to geojson
	features = map_data.groupby(level=0).apply(lambda x: dict(
		type='Feature',
		properties={},
		geometry=dict(
			type='LineString',
			coordinates=x[['shape_pt_lon', 'shape_pt_lat']].values.tolist()
		)
	)).values.tolist()

	return dict(
		type='geojson',
		features=features
	)

def load_stop_times():
	# load stop data
	return pd.read_csv('static/data/stops_and_times.csv').set_index('train') # , 'arrival_time'


map_geojson = load_map_geojson()
stop_times = load_stop_times()





@app.route('/')
def index():
    return render_template('index.j2', map_geojson=map_geojson)


@app.route('/data/stop-times/<line>')
def get_stop_time_data(line):
	try: # get times for a specific line
		data = stop_times.loc[line].to_dict(orient='records')
	except KeyError: # if it doesn't exist, return empty list
		data = []
	return jsonify(data)


if __name__ == '__main__':
	app.run(debug=True, port=5001)



'''

# Colors from https://i.pinimg.com/736x/a0/47/f3/a047f3e3b6063580970bad1e80ef4a59--subway-signs-subway-art.jpg
subway_lines = pd.DataFrame([
	('A', 'blue'),
	('B', 'orange'),
	('C', 'blue'),
	('D', 'orange'),
	('E', 'blue'),
	('F', 'orange'),
	('G', 'lime'),
	('H', 'black'),
	('I', 'black'),
	('J', 'brown'),
	('K', 'black'),
	('L', 'lightgrey'),
	('M', 'orange'),
	('N', 'yellow'),
	('O', 'black'),
	('P', 'black'),
	('Q', 'yellow'),
	('R', 'yellow'),
	('S', 'darkgrey'),
	('T', 'teal'),
	('U', 'black'),
	('V', 'black'),
	('W', 'black'),
	('X', 'black'),
	('Y', 'black'),
	('Z', 'brown'),
	('1', 'red'),
	('2', 'red'),
	('3', 'red'),
	('4', 'green'),
	('5', 'green'),
	('6', 'green'),
	('7', 'purple'),
	('8', 'black'),
	('9', 'black'),
], columns=['line', 'color'])

'''