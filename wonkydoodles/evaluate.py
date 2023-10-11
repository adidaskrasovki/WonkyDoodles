import math
import itertools

# PyTorch imports
import torch as tc
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms


class ConvNN(nn.Module):

    # Conv Output Size:
    # OutputWidth = (Width - FilterSize + 2*Padding) / (Stride) + 1
    def conv2d_out_dim(self, input_dim, kernel_size, padding, stride):
        return ((tc.tensor(input_dim) - tc.tensor(kernel_size) + 2*tc.tensor(padding)) / (tc.tensor(stride))) + 1
        # return (input_dim - kernel_size + 2*padding) / (stride) + 1

    def __init__(self, img_dim, fc1_dim, fc2_dim, fc3_dim, output_dim):
        super(ConvNN, self).__init__()

        self.pool = nn.MaxPool2d(kernel_size = 2,
                                 stride = 2,
                                 padding = 0)
        

        self.conv1 = nn.Conv2d(in_channels = img_dim[0],
                               out_channels = 8,
                               kernel_size = 9,
                               padding = 0,
                               stride = 1
                                )
        self.adapter_dim = self.conv2d_out_dim(img_dim[1:len(img_dim)], self.conv1.kernel_size, self.conv1.padding, self.conv1.stride)
        self.adapter_dim = self.conv2d_out_dim(self.adapter_dim, self.pool.kernel_size, self.pool.padding, self.pool.stride)


        self.conv2 = nn.Conv2d(in_channels = self.conv1.out_channels,
                               out_channels = 8,
                               kernel_size = 9,
                               padding = 0,
                               stride = 1
                                )
        self.adapter_dim = self.conv2d_out_dim(self.adapter_dim, self.conv2.kernel_size, self.conv2.padding, self.conv2.stride)
        self.adapter_dim = self.conv2d_out_dim(self.adapter_dim, self.pool.kernel_size, self.pool.padding, self.pool.stride)

        self.conv3 = nn.Conv2d(in_channels = self.conv2.out_channels,
                               out_channels = 8,
                               kernel_size = 9,
                               padding = 0,
                               stride = 1
                                )
        self.adapter_dim = self.conv2d_out_dim(self.adapter_dim, self.conv3.kernel_size, self.conv3.padding, self.conv3.stride)
        self.adapter_dim = self.conv2d_out_dim(self.adapter_dim, self.pool.kernel_size, self.pool.padding, self.pool.stride)
  
        self.adapter_dim = int((self.conv3.out_channels * self.adapter_dim[0] * self.adapter_dim[1]).item())
        print(self.adapter_dim)

        self.fc1 = nn.Linear(in_features = self.adapter_dim, out_features = fc1_dim)
        self.fc2 = nn.Linear(in_features = self.fc1.out_features, out_features = fc2_dim)
        self.fc3 = nn.Linear(in_features = self.fc2.out_features, out_features = fc3_dim)
        self.fc4 = nn.Linear(in_features = self.fc3.out_features, out_features = output_dim)
        
    def forward(self, x):
        out = self.pool(F.relu(self.conv1(x)))
        out = self.pool(F.relu(self.conv2(out)))
        out = self.pool(F.relu(self.conv3(out)))

        out = out.view(-1, self.adapter_dim)
        
        out = F.relu(self.fc1(out))
        out = F.relu(self.fc2(out))
        out = F.relu(self.fc3(out))
        out = self.fc4(out)
        return out


def perpendicularDistance(point, line):
    x0, y0 = point
    x1, y1 = line[0]
    x2, y2 = line[1]

    # Calculate the perpendicular distance
    return abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / math.sqrt((y2 - y1)**2 + (x2 - x1)**2)


def Line(point1, point2):
    return point1, point2


# source: https://karthaus.nl/rdp/
def DouglasPeucker(PointList, epsilon):
    # Find the point with the maximum distance
    dmax = 0
    index = 0
    end = len(PointList)
    for i in range(1, end - 1):
        d = perpendicularDistance(PointList[i], Line(PointList[0], PointList[end - 1]))
        if d > dmax:
            index = i
            dmax = d

    ResultList = []

    # If max distance is greater than epsilon, recursively simplify
    if dmax > epsilon:
        # Recursive call
        recResults1 = DouglasPeucker(PointList[:index + 1], epsilon)
        recResults2 = DouglasPeucker(PointList[index:], epsilon)

        # Build the result list
        ResultList = recResults1[:-1] + recResults2
    else:
        ResultList = [PointList[0], PointList[end - 1]]

    # Return the result
    return ResultList

def get_category(line_idx, txt_path):
    with open(txt_path) as f:
                line = itertools.islice(f, line_idx, line_idx+1)
                line = map(lambda s: s.strip(), line)
                return list(line)[0]
    
    
def eval_drawing(img, model, device='cpu'):
    with tc.no_grad():
        tns = transforms.ToTensor()(img).to(device)
        otpt = tc.softmax(model(tns)[0], dim = 0)

        prob_list = []
        for idx, category in enumerate(otpt):
            prob_list.append((get_category(idx, './wonkydoodles/static/label_list.txt'), round(100 * category.item(), 2)))

        prob_list.sort(key=lambda x: x[1], reverse=True)
        results = prob_list[:10]

        return results  
        