from flask import Flask, render_template, url_for, flash, redirect, request
from wonkydoodles import LocalStore, app, model, device, gallery_list, len_gallery_list
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
    global gallery_list
    global len_gallery_list

    if request.method == 'POST':
        img = request.json

        img['timestamp'] = datetime.timestamp(datetime.utcnow())
        filename = f"{img['timestamp']}_{img['category']}_{'r' if img['recognized'] else 'u'}"

        img_lite = {
            "category": img['category'],
            "recognized": img['recognized'],
            "base64": img['base64']
        }

        with open(f"./wonkydoodles/database/{filename}.json", "w") as f:
            json.dump(img, f)
        with open(f"./wonkydoodles/gallery/{filename}_l.json", "w") as f:
            json.dump(img_lite, f)

        gallery_list.insert(0, f"{filename}_l.json")
        len_gallery_list += 1

        return "Success"
    
    else: # if method == 'GET':
        try:
            args = request.args

            with open(f"./wonkydoodles/gallery/{gallery_list[int(args['idx'])]}", 'r') as f:
                 json_img = json.load(f)

            return json_img
                
        except IndexError:
            return '404'