from flask import Flask, render_template, url_for, flash, redirect, request, send_from_directory
from wonkydoodles import azureSQL, LocalStore, app, model, device, len_db#, db
# from wonkydoodles.models import Doodle, Stroke, Vector
from wonkydoodles.evaluate import get_category, eval_drawing
from wonkydoodles.validate import Validate

import warnings
warnings.filterwarnings("error")
from PIL import Image
Image.MAX_IMAGE_PIXELS = 65536
import base64
from io import BytesIO
from datetime import datetime, UTC
from random import randint
import zipfile

@app.route('/')
def landing():
    return render_template('landing.html')


@app.route('/download')
def download():
    return render_template('download.html', title='Download Database')


@app.route('/gallery', methods=['GET'])
def gallery():
    return render_template('gallery.html', title='Gallery')


@app.route('/draw')
def draw():
    return render_template('draw.html', title="Draw")


@app.route('/about')
def about():
    return render_template('about.html', title="About")


@app.route('/download/<path:path>')
def download_database(path):
    with azureSQL.AzureDB() as db:

        doodles_list = db.query("SELECT * FROM DOODLES", "")
        with open("./wonkydoodles/database/doodles_list.txt", "w") as f:
            f.write(' '.join(s for s in list(doodles_list[0].keys())) + '\n' + '\n')
            for t in doodles_list: f.write(' '.join(str(s) for s in t.values()) + '\n')

        strokes_list = db.query("SELECT * FROM STROKES", "")
        with open("./wonkydoodles/database/strokes_list.txt", "w") as f:
            f.write(' '.join(s for s in list(strokes_list[0].keys())) + '\n' + '\n')
            for t in strokes_list: f.write(' '.join(str(s) for s in t.values()) + '\n')

        vectors_list = db.query("SELECT * FROM VECTORS", "")
        with open("./wonkydoodles/database/vectors_list.txt", "w") as f:
            f.write(' '.join(s for s in list(vectors_list[0].keys())) + '\n' + '\n')
            for t in vectors_list: f.write(' '.join(str(s) for s in t.values()) + '\n')

        with zipfile.ZipFile("./wonkydoodles/database/wonkydoodlesdb.zip", 'w') as zip:
            zip.write("./wonkydoodles/database/doodles_list.txt", "/doodles_list.txt")
            zip.write("./wonkydoodles/database/strokes_list.txt", "/strokes_list.txt")
            zip.write("./wonkydoodles/database/vectors_list.txt", "/vectors_list.txt")

    return send_from_directory('database', 'wonkydoodlesdb.zip', as_attachment=True)


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
        with azureSQL.AzureDB() as db:
            img = request.json

            try:
                # Validation
                if not (Validate.category(img['category'], './wonkydoodles/static/label_list.txt') and
                    Validate.recognized(img['recognized']) and
                    Validate.countrycode(img['countrycode']) and
                    Validate.boundaries(img['boundaries'], range(0, 256))):
                        raise Exception("Validation error: Type 1")
                
                img['timestamp'] = str(datetime.timestamp(datetime.now(UTC)))

                
                # Add POSTed .json to Database

                # Initiate local Variables
                # Add Doodle
                doodle_query_string = "INSERT INTO Doodles (Doodles.category, Doodles.recognized, Doodles.timestamp, Doodles.countrycode, Doodles.x_max, Doodles.y_max) VALUES (?, ?, ?, ?, ?, ?)"
                doodle_query_values = [img['category'], img['recognized'], img['timestamp'], img['countrycode'], img['boundaries']['x_max'], img['boundaries']['y_max']]

                stroke_query_string = "INSERT INTO Strokes (DoodleID) VALUES"
                stroke_query_values = []

                vector_query_string = "INSERT INTO Vectors (Vectors.x, Vectors.y, Vectors.t, Vectors.StrokeID) VALUES"
                vector_query_values = []

                DoodleID = db.query('SELECT MAX(DoodleID) FROM Doodles', [])[0]['']
                DoodleID = 0 if DoodleID == None else DoodleID + 1
                StrokeID = db.query("SELECT MAX(StrokeID) FROM Strokes", [])[0]['']
                StrokeID = 0 if StrokeID == None else StrokeID + 1

                # Add Strokes
                for stroke_iter in img['strokelist']:
                    stroke_query_string += " (?),"
                    stroke_query_values.append(DoodleID)

                    # Add Vectors
                    for vector_iter in stroke_iter:

                        if not Validate.vector(vector_iter, range(0, 256)): raise Exception("Validation error: Type 2")

                        vector_query_string += " (?, ?, ?, ?),"
                        vector_query_values.append(vector_iter['x'])
                        vector_query_values.append(vector_iter['y'])
                        vector_query_values.append(vector_iter['t'])
                        vector_query_values.append(StrokeID)
                        
                    StrokeID += 1
                
                # Send local Variables to SQL
                db.insert(doodle_query_string, doodle_query_values)
                db.insert(stroke_query_string[:-1], stroke_query_values)
                db.insert(vector_query_string[:-1], vector_query_values)

            except:
                db.cursor.rollback()
                return "failure"

            else:
                db.cursor.commit()
                len_db += 1
                return "success"

    else: # if method == 'GET'
        try:
            args = request.args
            idx = int(args['idx'])

            with azureSQL.AzureDB() as db:
                doodle = db.query("SELECT TOP 1 Doodles.category, Doodles.recognized, Doodles.x_max, Doodles.y_max FROM Doodles WHERE DoodleID = ?", [len_db - idx])[0]

                strokes = db.query("SELECT Strokes.StrokeID FROM Strokes WHERE Strokes.DoodleID = ?", [len_db - idx])
                strokelist = []
                for stroke in strokes:
                    vectorlist = db.query("SELECT Vectors.x, Vectors.y FROM Vectors WHERE Vectors.StrokeID = ?", [stroke['strokeid']])
                    strokelist.append(vectorlist)

                doodle['strokelist'] = strokelist
            return doodle
        
        except Exception as error: 
            print(error)
            return '404'
