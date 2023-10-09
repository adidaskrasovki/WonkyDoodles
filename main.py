from flask import Flask, render_template, url_for, flash, redirect, request, send_file
from forms import RegistrationForm, LoginForm
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from random import randint

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

app = Flask(__name__)
app.config['SECRET_KEY'] = 'a7c8458ab710af8c4956f350062c63e5'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
db = SQLAlchemy(app)

@app.route('/', methods=['GET'])
@app.route('/home')
def home():
    return render_template('home.html', title="Draw", category=get_category(randint(0,344), './static/label_list.txt'))


@app.route('/gallery', methods=['GET'])
def gallery():
    return render_template('gallery.html', title='Gallery')


@app.route('/about')
def about():
    return render_template('about.html', title="About")


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

    if request.method == 'POST':
        image = request.data
        image = base64.b64decode(image)        
        image = Image.open(BytesIO(image)).convert('1')
        time = datetime.now()
        image.save(f"./gallery/{time.strftime('%m%d%Y-%H%M%S-%f')}.png")

        gallery_list.insert(0, f"{time.strftime('%m%d%Y-%H%M%S-%f')}.png")

        return "Success"
    
    else:
        try:
            args = request.args
            img = Image.open(f"./gallery/{gallery_list[int(args['idx'])]}")
            file_object = BytesIO()
            img.save(file_object, format='png')
            file_object.seek(0)
            file_object = base64.b64encode(file_object.getvalue()).decode()       

            return file_object
        
        except IndexError:
            return '404'


if __name__ == "__main__":

    # Populate gallery filename list
    gallery_list = listdir('./gallery')
    gallery_list.pop(0)
    gallery_list.reverse()

    # Run Flask
    app.run()
