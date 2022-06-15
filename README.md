# teachable_machine_clone

# Starting the project
Download the repo.
Go to the project directory and run "npm install". This will install all the dependencies.
Then run "node index" to start the project. Your project will run on "http://localhost:3000"

# About the project
A project to start Machine Learning on the browser built with Tensorflow Js. This project works with images as inputs.

# Prepare your datasets
1. You will first need to prepare your datasets, by adding grayscale images (28 * 28 pixels), with a label name.
2. After the datasets are ready, you can start to train the model (minimun 2 datasets are required for training..).

# Training the model
1. Provide the no of epochs (or rounds) you want to train the model (value must be between 4 - 150).
2. The training history will be shown on the "Training history" box.
3. After the training is finished, the model will be saved in your "client/model" directory.

# Making predictions
1. After the training is over and the model is saved, you can start making predictions and see the results.
2. You can either choose an grayscale image file or draw on a canvas.
