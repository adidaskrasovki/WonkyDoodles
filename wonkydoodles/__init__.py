from flask import Flask
from flask_sqlalchemy import SQLAlchemy

from os import listdir, path
import torch as tc
# from PIL import Image


#### CLASSES ####
#################

class LocalStore:
    def __call__(self, f: callable):
        f.__globals__[self.__class__.__name__] = self
        return f

# GLOBAL Flask config / SQLite
app = Flask(__name__)
app.config['SECRET_KEY'] = 'a7c8458ab710af8c4956f350062c63e5'
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///" + path.abspath('./wonkydoodles/database/wonkydoodles.db')

db = SQLAlchemy(app)

# CUDA
device = tc.device('cuda') if tc.cuda.is_available() else tc.device('cpu')

# Load model
filepath = './wonkydoodles/static/'
filename = "WonkyDoodles.pth"
model = tc.load(f"{filepath}{filename}", map_location=device)

# get length of database
from wonkydoodles.models import Doodle
len_db = 0
with app.app_context():
    len_db = db.session.query(Doodle).count()

from wonkydoodles import routes
