from flask import Flask, render_template, url_for, flash, redirect, request, send_from_directory
from wonkydoodles import LocalStore, app, db, model, device, len_db
from wonkydoodles.models import Doodle, Stroke, Vector
from wonkydoodles.evaluate import get_category, eval_drawing
from wonkydoodles.validate import Validate

import warnings
warnings.filterwarnings("error")
from PIL import Image
Image.MAX_IMAGE_PIXELS = 65536
import base64
from io import BytesIO
from datetime import datetime
from random import randint
import json


@app.route('/')
def landing():
    return render_template('landing.html')


@app.route('/download')
def download():
    return render_template('download.html', title='Download Database')


@app.route('/gallery', methods=['GET'])
def gallery():
    return render_template('gallery.html', title='Gallery')


#@app.route('/', methods=['GET'])
@app.route('/draw')
def draw():
    return render_template('draw.html', title="Draw")


@app.route('/about')
def about():
    return render_template('about.html', title="About")


@app.route('/download/<path:path>')
def download_database(path):
    return send_from_directory('database', 'wonkydoodles.db', as_attachment=True)


@app.route('/stage_category', methods=['GET'])
def stage_category():
    return get_category(randint(0,344), './wonkydoodles/static/label_list.txt')


@app.route('/eval_img', methods=['GET',  'POST'])
@LocalStore()
def eval_img():
    if request.method == 'POST':
        image = request.data
        image = base64.b64decode(image)
        image = Image.open(BytesIO(image)).convert('1')

        LocalStore.results = eval_drawing(image, model, device)
        return "success"
    else: # if method = 'GET':
        return LocalStore.results


@app.route('/img_handler', methods=['GET', 'POST'])
def img_handler():
    global len_db

    if request.method == 'POST':
        img = request.json

        try:
            if not (Validate.category(img['category'], './wonkydoodles/static/label_list.txt') and
                Validate.recognized(img['recognized']) and
                Validate.countrycode(img['countrycode']) and
                Validate.boundaries(img['boundaries'], range(0, 256))):
                    raise Exception("Validation error: Type 1")
            
            img['timestamp'] = datetime.timestamp(datetime.utcnow())

            # Add POSTed .json to Database
            # Add Doodle Block
            doodle = Doodle(category = img['category'],
                            recognized = img['recognized'],
                            timestamp = img['timestamp'],
                            countrycode = img['countrycode'],
                            x_max = img['boundaries']['x_max'],
                            y_max = img['boundaries']['y_max']
                            )
            db.session.add(doodle)
        
            # Add Stroke Block
            for stroke_iter in img['strokelist']:

                stroke = Stroke(doodle_id = doodle.id)
                doodle.strokelist.append(stroke)

                # Add Vector Block
                for vector_iter in stroke_iter:
                    if not Validate.vector(vector_iter, range(0, 256)): raise Exception("Validation error: Type 2")

                    vector = Vector(x = vector_iter['x'],
                                    y = vector_iter['y'],
                                    t = vector_iter['t'],
                                    stroke_id = stroke.id
                                    )
                    stroke.stroke.append(vector)

        except:
            db.session.rollback()
            return "failure"
        
        else:
            db.session.commit()
            len_db += 1
            return "success"
    
    else: # if method == 'GET':
        try:
            args = request.args
            idx = int(args['idx'])
            db_doodle = db.session.get(Doodle, len_db - idx)

            # Make Strokelist, containing all (strokes containing its respective vectors)
            strokes = db_doodle.strokelist
            strokelist = []
            for stroke in strokes:
                vectorlist = []
                for vector in stroke.stroke:
                    vectorlist.append({'x': vector.x, 'y': vector.y})
                strokelist.append(vectorlist)

            doodle = {'category': db_doodle.category,
                      'recognized': db_doodle.recognized,
                      'x_max': db_doodle.x_max,
                      'y_max': db_doodle.y_max,
                      'strokelist': strokelist                 
                      }

            return doodle
                
        except:
            return '404'