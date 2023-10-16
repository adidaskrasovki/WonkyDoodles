from datetime import datetime
from wonkydoodles import db


class Doodle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.Integer, nullable = False, default='??')
    recognized = db.Column(db.Boolean, nullable=False, default=False)
    timestamp = db.Column(db.String(17), nullable=False, default=0)
    countrycode = db.Column(db.String(2), nullable=False, default = '??')
    base64 = db.Column(db.Text, nullable=False, default='??')
    strokelist = db.Relationship('Stroke', backref='Doodle', lazy=True)

    def __repr__(self):
        return f"category: {self.category}, recognized: {self.recognized}, timestamp: {self.timestamp}, country: {self.countrycode}"
    

class Stroke(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doodle_id = db.Column(db.Integer, db.ForeignKey('doodle.id'), nullable=False)
    stroke = db.Relationship('Vector', backref='Stroke', lazy=True)

    def __repr__(self):
        return f"id: {self.id}, , doodle_id: {self.doodle_id}"
    

class Vector(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    x = db.Column(db.Integer, nullable=False, default=0)
    y = db.Column(db.Integer, nullable=False, default=0)
    t = db.Column(db.Integer, default=0)
    stroke_id = db.Column(db.Integer, db.ForeignKey('stroke.id'), nullable=False)

    def __repr__(self):
        return f"id: {self.id}, x: {self.x}, y: {self.y}, t: {self.t}"