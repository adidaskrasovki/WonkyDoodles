from io import BytesIO
import base64
from PIL import Image


class Validate():

    def category(category, categories_txt):
        if isinstance(category, (str)):
            with open(categories_txt, 'r') as f:
                lines = f.readlines()
                for line in lines:
                    if line.replace('\n', '') == category: return True
        return False
    
    def recognized(recognized):
        return isinstance(recognized, (bool))
    
    def countrycode(countrycode):
        if isinstance(countrycode, (str)) and len(countrycode) == 2:
            return True
        return False

    def b64(image):
        if isinstance(image, (str)):
            image = base64.b64decode(image)
            image = Image.open(BytesIO(image)).convert('1')
            try:
                image.verify()
                return True
            except: return False
        return False
        
    def vector(vector, interval):
        if  len(vector) != 3: return False
        if (isinstance(vector['x'], (int)) and vector['x'] in interval and
            isinstance(vector['y'], (int)) and vector['y'] in interval and
            isinstance(vector['t'], (int)) and vector['t'] >= 0):
            return True
        return False