from flask_sqlalchemy import SQLAlchemy
from datetime import datetime


class Image(db.model):
    id = db.column(db.Integer, primary_key=True)
    category = db.column(db.Integer, nullable = False, default='??')
    recogized = db.column(db.Bool, nullable=False, default=False)
    timestamp = db.column(db.DateTime, nullable=False, default=datetime.timestamp(datetime.utcnow))
    countrycode = db.column(db.String(2), nullable=False, default = '??')
    base64 = db.column(db.Text, nullable=False, default='??')
    vectorlists = db.relationship('Vectorlist', backref='Image', lazy=True)

class Vectorlist(db.model):
    t = db.column(db.Numeric, primary_key=True)
    x = db.column(db.Integer, nullable=False, default=0)
    y = db.column(db.Integer, nullable=False, default=0)
    image_ig = db.column(db.Integer, db.ForeignKey('image.id'), nullable=False)