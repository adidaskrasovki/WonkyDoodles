import os
from PIL import Image

img = os.listdir('./gallery')[0]
img = Image.open(f'./gallery/{img}')
img.show()