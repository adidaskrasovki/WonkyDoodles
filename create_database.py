from wonkydoodles import db, app
from wonkydoodles.models import Doodle, Stroke, Vector

# Use the imported classes somehow. Otherwise some IDEs might not import them.
d = Doodle()
s = Stroke()
v = Vector()

# CAUTION! WIP. Right now, the original DB will be replaced.
with app.app_context():
    db.create_all()
