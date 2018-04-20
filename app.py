import numpy as np
import pandas as pd
from flask import Flask
from flask import request, render_template, jsonify, make_response

app = Flask(__name__)



# Colors from https://i.pinimg.com/736x/a0/47/f3/a047f3e3b6063580970bad1e80ef4a59--subway-signs-subway-art.jpg
stations = pd.DataFrame([
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
], columns=['station', 'color'])










@app.route('/')
def index():
    return render_template('index.j2', stations=stations.to_dict(orient='records'))


if __name__ == '__main__':
	app.run(debug=True, port=5001)