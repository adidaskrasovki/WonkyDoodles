from flask import Flask
from flask_sqlalchemy import SQLAlchemy

from os import listdir
import torch as tc

#### CLASSES ####
#################

class LocalStore:
    def __call__(self, f: callable):
        f.__globals__[self.__class__.__name__] = self
        return f

# GLOBAL Flask config / SQLite
app = Flask(__name__)
app.config['SECRET_KEY'] = 'a7c8458ab710af8c4956f350062c63e5'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database/WonkyDoodles.db'
db = SQLAlchemy(app)

# CUDA
device = tc.device('cuda') if tc.cuda.is_available() else tc.device('cpu')

# Load model
filepath = './wonkydoodles/static/'
filename = "WonkyDoodles.pth"
model = tc.load(f"{filepath}{filename}", map_location=device)

# Populate gallery filename list
gallery_list = listdir('./wonkydoodles/gallery')
gallery_list.pop(0)
gallery_list.reverse()
len_gallery_list = len(gallery_list)

from wonkydoodles import routes
