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

    def boundaries(boundaries, interval):
        if len(boundaries) != 2: return False
        if (isinstance(boundaries['x_max'], (int)) and boundaries['x_max'] in interval and
            isinstance(boundaries['y_max'], (int)) and boundaries['y_max'] in interval):
            return True
        return False
        
    def vector(vector, interval):
        if  len(vector) != 3: return False
        if (isinstance(vector['x'], (int)) and vector['x'] in interval and
            isinstance(vector['y'], (int)) and vector['y'] in interval and
            isinstance(vector['t'], (int)) and vector['t'] >= 0):
            return True
        return False