### ALL THE IMPORTS ###
#######################

# PyTorch imports
import torch as tc
import torch.nn as nn
import torch.nn.functional as F

# CUDA
if tc.cuda.is_available():
    device = tc.device("cuda")
else:
    device = tc.device("cpu")

# print(f"CUDA is available: {tc.cuda.is_available()}")


#### MODEL CLASSES ####
#######################

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