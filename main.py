from flask import Flask, render_template, url_for, flash, redirect, request
from forms import RegistrationForm, LoginForm
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from random import randint
import json

from PIL import Image
import base64
from io import BytesIO
from os import listdir
import torch as tc
from evaluate import *

class LocalStore:
    def __call__(self, f: callable):
        f.__globals__[self.__class__.__name__] = self
        return f

# CUDA
if tc.cuda.is_available():
    device = tc.device("cuda")
else:
    device = tc.device("cpu")

# Load model
filepath = './static/'
filename = "WonkyDoodles.pth"
model = tc.load(f"{filepath}{filename}", map_location=device)

# gallery list
gallery_list = []
len_gallery_list = 0

app = Flask(__name__)
app.config['SECRET_KEY'] = 'a7c8458ab710af8c4956f350062c63e5'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
db = SQLAlchemy(app)

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
    return get_category(randint(0,344), './static/label_list.txt')


@app.route('/eval_img', methods=['GET',  'POST'])
@LocalStore()
def eval_img():
    if request.method == 'POST':
        image = request.data
        image = base64.b64decode(image)
        image = Image.open(BytesIO(image)).convert('1')

        LocalStore.results = eval_drawing(image, model, device)
        return "success"
    else:
        return LocalStore.results


@app.route('/img_handler', methods=['GET', 'POST'])
def img_handler():
    global gallery_list
    global len_gallery_list

    if request.method == 'POST':
        img = request.json
        img_lite = {
            "category": img['category'],
            "timestamp": img['timestamp'],
            "recognized": img['recognized'],
            "base64": img['base64']
        }
        filename = f"{img['timestamp']}_{img['category']}_{'r' if img['recognized'] else 'u'}"

        with open(f"./database/{filename}.json", "w") as f:
            json.dump(img, f)

        with open(f"./gallery/{filename}_l.json", "w") as f:
            json.dump(img_lite, f)

        gallery_list.insert(0, f"{filename}_l.json")
        len_gallery_list += 1

        return "Success"
    
    else: # if method == 'GET':
        try:
            args = request.args

            with open(f"./gallery/{gallery_list[int(args['idx'])]}", 'r') as f:
                 json_img = json.load(f)

            return json_img
                
        except IndexError:
            return '404'


if __name__ == "__main__":

    # Populate gallery filename list
    gallery_list = listdir('./gallery')
    gallery_list.pop(0)
    gallery_list.reverse()
    len_gallery_list = len(gallery_list)

    # Run Flask
    app.run()
