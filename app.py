import os
import numpy as np
import pandas as pd
from flask import Flask
from flask import request, render_template, jsonify, make_response

app = Flask(__name__)


data_dir = 'static/data/GTFS_nyc_Subway/'
data_file = lambda f: os.path.join(data_dir, f)

def load_map_geojson():
	# load map data
	map_data = pd.read_csv(data_file('shapes.txt')).set_index(['shape_id', 'shape_pt_sequence']).drop('shape_dist_traveled', 1).dropna()

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
	return pd.read_csv(data_file('stops_and_times.csv')).set_index('train') # , 'arrival_time'


def dist_from_coordinates(pt1, pt2):
  R = 6371  # Earth radius in km

  #conversion to radians
  d_lon, d_lat = np.radians(pt2 - pt1)
  r_lat1, r_lat2 = np.radians((pt1[1], pt2[1]))

  #haversine formula
  a = np.sin(d_lat/2.)**2 + np.cos(r_lat1) * np.cos(r_lat2) * np.sin(d_lon/2.)**2
  return 2 * R * np.arcsin(np.sqrt(a))


def load_stations():
	# load information about stations
	return pd.read_csv(data_file('stop_train.csv')).set_index('train')

def load_subway_labels():
	return pd.read_csv(data_file('routes.txt'))


map_geojson = load_map_geojson()
stop_times = load_stop_times()
stations = load_stations()
subway_labels = load_subway_labels()
line_colors = subway_labels.set_index('route_id')['route_color'].fillna('black')




@app.route('/')
def index():
    return render_template('index.j2', 
    		map_geojson=map_geojson, stations=stations.reset_index().to_dict(orient='records'), 
    		subway_labels=subway_labels.to_dict(orient='records'), line_colors=line_colors.to_dict())




'''
Get Data

We need:

stations: # for x axis
	name
	distance (along line)
	(geographic position) # if we map

stops_and_times: # for paths 
	arrival time
	departure time
	station distance
	(shape_id) # if we map
	
	

'''


@app.route('/data/stations/<line>')
def get_station_data(line):
	# try: # get times for a specific line
	# 	data = stop_times.loc[line].to_dict(orient='records')
	# except KeyError: # if it doesn't exist, return empty list
	# 	data = []
	try: # get times for a specific line
		df = stations.loc[line].sort_values('stop_id')
		# filter for only stations on `line` and sort order
		latlon = df[['stop_lon', 'stop_lat']].values
		df['distance'] = [0] + [dist_from_coordinates(pt1, pt2) for pt1, pt2 in zip(latlon[1:], latlon[:-1])]
		df['distance'] = df['distance'].cumsum()
		data = df.to_dict(orient='records')
	except KeyError: # if it doesn't exist, return empty list
		data = []
	
	return jsonify(data)

@app.route('/data/trips/<line>')
def get_trips_data(line):
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