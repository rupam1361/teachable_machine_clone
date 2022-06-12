const express = require("express");
const app = express();

const http = require("http").createServer(app);

const path = require("path");
const fs = require("fs");
const multer = require("multer");

const io = require("socket.io")(http);

const tf = require("@tensorflow/tfjs-node");

const TRAINING_IMAGES_DIR = "./destDir";

app.use(express.json());

app.set("views", path.join(__dirname, "client"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "/index.html"));
});

app.get("/client/main.js", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "/main.js"));
});

app.get("/client/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "/style.css"));
});

app.get("/client/model/:modelpart", (req, res) => {
  res.sendFile(
    path.join(__dirname, "client", "/model", `/${req.params.modelpart}`)
  );
});

app.get("/destDir/:folder/:file", (req, res) => {
  res.sendFile(
    path.join(__dirname, "destDir", req.params.folder, req.params.file)
  );
});

//CREATE A DESTINATION DIRECTORY TO UPLOAD THE IMAGE FILES..
const storage = multer.diskStorage({
  destination: `./uploads`,

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpg|jpeg|png|gif/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb("Error: Images only...");
    }
  },
}).array("myImage", 4000);

// UPLOAD ROUTE FOR UPLOADING THE IMAGES
app.post("/uploads", (req, res) => {
  fs.readdir("./uploads", (err, deletefiles) => {
    if (err) throw err;
    if (deletefiles.length > 0) {
      for (const file of deletefiles) {
        fs.unlink(path.join("./uploads", file), (err) => {
          if (err) throw err;
        });
      }
    }
    upload(req, res, (err) => {
      if (err) {
        res.json({
          message: err,
        });
      } else {
        if (req.files == undefined) {
          res.json({
            message: "No file selected...",
          });
        } else {
          arrangeFiles(req, res);
          console.log(
            `Folder ${req.body.label} with ${req.files.length} files uploaded successfully..`
          );
          res.status(200).json({
            message: `Folder ${req.body.label} with ${req.files.length} files uploaded successfully..`,
          });
        }
      }
    });
  });
});

// FUNCTION FOR ARRANGING THE UPLOADED FILES
function arrangeFiles(req, res) {
  fs.readdir("./uploads", (err, files) => {
    let dir = `./destDir/${req.body.label}`;
    if (!fs.existsSync(dir)) {
      fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) console.log(err);
        if (files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            fs.copyFile(
              `./uploads/${files[i]}`,
              `${dir}/${files[i]}`,
              (err, data) => {
                if (err) console.log(err);
              }
            );
          }
        }
      });
    }
  });
}

// ROUTE FOR SENDING THE UPLOADED IMAGES TO CLIENT
app.get("/getTrainingData", async (req, res) => {
  let trainingDataArr = [];
  let trainingDataObj;

  const dir = "./destDir";
  if (!fs.existsSync(dir)) return;
  const folders = fs.readdirSync(dir);
  for (let i = 0; i < folders.length; i++) {
    const files = fs.readdirSync(`./destDir/${folders[i]}`);
    trainingDataObj = {
      folder: folders[i],
      files: files,
    };
    trainingDataArr.push(trainingDataObj);
  }

  res.status(200).json(trainingDataArr);
});

// TENSORFLOW JS
function loadImages(dataDir) {
  const trainingImages = fs.readdirSync(dataDir);
  const images = [];
  const labels = [];

  console.log(trainingImages);

  for (let i = 0; i < trainingImages.length; i++) {
    var files = fs.readdirSync(`${dataDir}/${trainingImages[i]}`);

    for (let j = 0; j < files.length; j++) {
      var filePath = path.join(`${dataDir}/${trainingImages[i]}`, files[j]);

      var buffer = fs.readFileSync(filePath);

      const tfimage = tf.node.decodeImage(buffer);
      const imageTensor = tf.image
        .resizeNearestNeighbor(tfimage, [28, 28])
        .mean(2)
        .expandDims(2)
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims();

      images.push(imageTensor);
      labels.push(i);
    }
  }
  return [images, labels];
}

function loadData() {
  const trainData = loadImages(TRAINING_IMAGES_DIR);

  const trainingImages = fs.readdirSync(TRAINING_IMAGES_DIR);
  const depth = trainingImages.length;

  return {
    images: tf.concat(trainData[0]),
    labels: tf.oneHot(tf.tensor1d(trainData[1], "int32"), depth),
    depth: depth,
  };
}

// ROUTE FOR TRAINING THE MODEL
app.post("/train", (req, res) => {
  async function train() {
    const model = require("./model");

    const saveModelPath = "file://./client/model/";
    const data = loadData();
    const trainImages = data.images;
    const trainLabels = data.labels;

    console.log(trainImages);
    console.log(trainLabels);

    const trainData1 = loadImages(TRAINING_IMAGES_DIR);
    let totalBatch = Math.round(trainData1[0].length / 32);

    await model.fit(trainImages, trainLabels, {
      epochs: req.body.epoch,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          io.emit("epochEnd", {
            epoch: epoch,
            totalEpoch: req.body.epoch,
            logs: logs,
          });
        },
        onYield: (epoch, batch, logs) => {
          io.emit("yield", {
            epoch: epoch,
            totalEpoch: req.body.epoch,
            progress: (batch / totalBatch) * 100,
            logs: logs,
          });
        },
      },
    });

    await model
      .save(saveModelPath)
      .then(() => console.log("model saved successfully"))
      .then(() => {
        res.status(200).json({
          message: "Training completed. Model saved successfully...",
          label: fs.readdirSync(TRAINING_IMAGES_DIR),
        });
      });
  }

  train();
});

//TESTING THE MODEL

const Jimp = require("jimp");
const storage1 = multer.diskStorage({
  destination: `./imageToBePredicted`,

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload1 = multer({
  storage: storage1,
  limits: { fileSize: 1000000000 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpg|jpeg|png|gif/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb("Error: Images only...");
    }
  },
}).single("imageToBePredicted");

app.post("/predict", (req, res) => {
  fs.readdir("./imageToBePredicted", async (err, deletefiles) => {
    if (err) throw err;
    if (deletefiles.length > 0) {
      for (const file of deletefiles) {
        fs.unlink(path.join("./imageToBePredicted", file), (err) => {
          if (err) throw err;
        });
      }
    }
    const modelUrl = "file://./client/model/model.json";
    const model = await tf.loadLayersModel(modelUrl);
    await upload1(req, res, (err) => {
      if (err) {
        res.json({
          message: err,
        });
      } else {
        console.log(`File uploaded successfully..`);

        // console.log(req.body);
        console.log(req.file);

        if (req.file.path != undefined) {
          const imageToPixels = async (imgPath) => {
            const pixeldata = [];
            const image = await Jimp.read(imgPath);
            await image
              .resize(28, 28)
              // .greyscale()  // if the image is rgb, it can be converted to grayscale
              // .invert()  // use this function if the image needs to be inverted,
              .scan(0, 0, 28, 28, (x, y, idx) => {
                let v = image.bitmap.data[idx + 0];
                pixeldata.push(v / 255);
              });

            return pixeldata;
          };

          const predictImage = (imgPath) => {
            console.log(imageToPixels(imgPath));
            return imageToPixels(imgPath).then((pixeldata) => {
              const imageTensor = tf
                .tensor(pixeldata, [28, 28, 1])
                .expandDims();

              const prediction = model.predict(imageTensor);
              const scores = prediction.arraySync()[0];
              console.log(scores);

              const maxScore = prediction.max().arraySync();
              const maxScoreIndex = scores.indexOf(maxScore);
              console.log(maxScoreIndex);

              res.status(200).json({
                score: maxScoreIndex,
                message: `File uploaded successfully..`,
              });
            });
          };

          predictImage(req.file.path);
        }
      }
    });
  });
});

const PORT = 3000;

http.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
