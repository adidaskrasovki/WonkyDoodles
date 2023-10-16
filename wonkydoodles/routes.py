from flask import Flask, render_template, url_for, flash, redirect, request
from wonkydoodles import LocalStore, app, db, model, device, len_db
from wonkydoodles.models import Doodle, Stroke, Vector
from wonkydoodles.evaluate import get_category, eval_drawing

from PIL import Image
import base64
from io import BytesIO
from datetime import datetime
from random import randint
import json

@app.route('/', methods=['GET'])
@app.route('/home')
def home():
    return render_template('home.html', title="Draw")


@app.route('/gallery', methods=['GET'])
def gallery():
    return render_template('gallery.html', title='Gallery')


@app.route('/about')
def about():
    return render_template('about.html', title="About")


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
        img['timestamp'] = datetime.timestamp(datetime.utcnow())

        doodle = Doodle(category = img['category'],
                        recognized = img['recognized'],
                        timestamp = img['timestamp'],
                        countrycode = img['countrycode'],
                        base64 = img['base64']
                        )
        db.session.add(doodle)
        db.session.commit()
        
        for stroke_iter in img['strokelist']:
            stroke = Stroke(doodle_id = doodle.id                     
                            )
            db.session.add(stroke)
            db.session.commit()
            for vector_iter in stroke_iter:
                vector = Vector(x = vector_iter['x'],
                                y = vector_iter['y'],
                                t = vector_iter['t'],
                                stroke_id = stroke.id
                                )
                db.session.add(vector)
            db.session.commit()

        len_db += 1

        return "Success"
    
    else: # if method == 'GET':
        try:
            args = request.args
            idx = int(args['idx'])

            doodle = {'category': db.session.get(Doodle, len_db - idx).category,
                      'recognized': db.session.get(Doodle, len_db - idx).recognized,
                      'base64': db.session.get(Doodle, len_db - idx).base64                   
                      }
            doodle = json.dumps(doodle, indent = 1) 

            return doodle
                
        except:
            return '404'