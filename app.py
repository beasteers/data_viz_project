import os
import json
import numpy as np
import pandas as pd
from flask import Flask
from flask import request, render_template, jsonify, make_response

app = Flask(__name__)


data_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static/data/GTFS_nyc_Subway/')
data_file = lambda f: os.path.join(data_dir, f)

def load_map_geojson():
	# load map data
	map_data = pd.read_csv(data_file('new_shape.csv'))
	map_data['train'] = map_data['shape_id'].apply(lambda s: s.split('.')[0])
	map_data['direction'] = map_data['shape_id'].apply(lambda s: s.split('.')[-1])
	map_data['route_color'] = map_data['route_color'].fillna('')

	map_data = map_data.set_index(['shape_id', 'shape_pt_sequence']).drop('shape_dist_traveled', 1).dropna()
	
	def get_feature(x):
		colors = x.route_color.unique()
		trains = x.train.unique()
		directions = x.direction.unique()
		return dict(
			type='Feature',
			properties=dict(
				route_color=colors[0] if len(colors) else '',
				train=trains[0] if len(trains) else '',
				direction=directions[0] if len(directions) else '',
			),
			geometry=dict(
				type='LineString',
				coordinates=x[['shape_pt_lon', 'shape_pt_lat']].values.tolist()
			)
		)

	# convert to geojson
	features = map_data.groupby(level=0).apply(get_feature).values.tolist()

	return dict(
		type='FeatureCollection',
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
	df = pd.read_pickle(data_file('stop_train.pkl')).set_index(['train', 'stop_sequence']).sort_index()
	return df

def load_subway_labels():
	return pd.read_csv(data_file('routes.txt'))

def get_station_geojson(stations):
	# convert to geojson
	features = stations.reset_index().apply(lambda x: dict(
		type='Feature',
		properties=x.to_dict(),
		geometry=dict(
			type='Point',
			coordinates=(x['stop_lon'], x['stop_lat'])
		)
	), axis=1).values.tolist()

	return dict(
		type='FeatureCollection',
		features=features
	)

def get_distances_for_line(line):
	# filter for only stations on `line` and sort order
	df = stations.loc[line].copy()
	latlon = df[['stop_lon', 'stop_lat']].values
	df['distance'] = pd.Series([0] + [dist_from_coordinates(pt1, pt2) for pt1, pt2 in zip(latlon[1:], latlon[:-1])], index=df.index)
	df['distance'] = df['distance'].cumsum()
	return df



map_geojson = load_map_geojson() # loads line data for mapping
stop_times = load_stop_times() # loads the data for the individual train trips
stations = load_stations() # for getting station axis data
station_geojson = get_station_geojson(stations) # for drawing station points on map
subway_labels = load_subway_labels() # load the data for each individual subway line
line_colors = subway_labels.set_index('route_id')['route_color'].fillna('') # get a mapping of line -> color




@app.route('/')
def index():
    return render_template('index.j2', 
    		map_geojson=map_geojson, stations=station_geojson, 
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



@app.route('/data/trips/<line>')
def get_trips_data(line):
	station_data = get_distances_for_line(line)
	distances = station_data[['stop_name', 'distance']]
	data = pd.merge(stop_times.loc[line], distances, on='stop_name')
	data = data.groupby('trip_id').apply(lambda df: df.to_dict(orient='records'))
	
	return jsonify({
		'stations': station_data.to_dict(orient='records'),
		'trips': data.tolist()
	})






if __name__ == '__main__':
	app.run(debug=True, port=5001, threaded=True)



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