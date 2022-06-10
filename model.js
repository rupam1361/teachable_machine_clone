const tf = require("@tensorflow/tfjs");
const fs = require("fs");

const dataDir = "./destDir";

let units = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).length : 2;

const model = tf.sequential();

model.add(
  tf.layers.conv2d({
    inputShape: [28, 28, 1],
    kernelSize: 3,
    filters: 16,
    activation: "relu",
  })
);
model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
model.add(tf.layers.conv2d({ kernelSize: 3, filters: 64, activation: "relu" }));
model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
model.add(tf.layers.flatten());
model.add(tf.layers.dense({ units: 128, activation: "relu" }));
model.add(tf.layers.dense({ units: units, activation: "softmax" }));

const optimizer = tf.train.adam(0.0001);
model.compile({
  optimizer: optimizer,
  loss: "categoricalCrossentropy",
  metrics: ["accuracy"],
});

module.exports = model;
