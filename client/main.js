let formData = new FormData();
const uploadBtn = document.createElement("button");
uploadBtn.id = "uploadBtn";
uploadBtn.textContent = "Upload";

const chooseFolder = document.getElementById("selectImageFolder");

let displayImageWrapper = document.getElementById("displayImageWrapper");

let displayImage;

chooseFolder.addEventListener("change", (e) => {
  // console.log(e.target.files);

  for (let i = 0; i < e.target.files.length; i++) {
    displayImage = document.createElement("img");

    displayImage.src = URL.createObjectURL(e.target.files[i]);
    displayImage.style.marginRight = "4px";

    displayImage.setAttribute("id", "displayImage");
    displayImage.setAttribute("width", 28);
    displayImageWrapper.append(displayImage);

    formData.append("myImage", e.target.files[i], e.target.files[i].name);
  }

  const br = document.createElement("br");
  const br1 = document.createElement("br");

  displayImageWrapper.append(br);
  displayImageWrapper.append(br1);

  displayImageWrapper.append(uploadBtn);
});

let areFilesCompatible;

function uploadFiles() {
  var childrendivs = [],
    children = displayImageWrapper.children;
  for (var i = 0; i < children.length; i++) {
    if (children[i].tagName == "IMG") {
      childrendivs.push(children[i]);
    }
  }

  console.log(childrendivs.length);

  for (let i = 0; i < childrendivs.length; i++) {
    if (
      childrendivs[i].naturalHeight > 28 ||
      childrendivs[i].naturalWidth > 28
    ) {
      alert(
        "Selected files contains image with size exceeding 28 * 28 pixels. Please adjust them accordingly..."
      );
      areFilesCompatible = false;
      break;
    } else {
      areFilesCompatible = true;
    }
  }

  if (areFilesCompatible) {
    if (labelInput.value == "") {
      alert("Label name cannot be empty..");
    } else {
      formData.append("label", labelInput.value);
      axios
        .post(`${API_URL}/uploads`, formData)
        .then((res) => {
          console.log(res);
          alert(res.data.message);
        })
        .then(() => getTrainingData())
        .then(() => {
          window.location.href = "/";
        });

      console.log(labelInput.value);

      console.log("Upload...");
    }
  }
}

uploadBtn.addEventListener("click", uploadFiles);

let noTrainingData = document.getElementById("noTrainingData");
const destDir = document.getElementById("destDir");

let datasetsLength;

function getTrainingData() {
  axios.get("/getTrainingData").then((res) => {
    for (let i = 0; i < res.data.length; i++) {
      labels.push(res.data[i].folder);
      console.log(res.data[i].folder);
    }
    datasetsLength = res.data.length;

    if (res.data.length <= 0) return;
    for (let i = 0; i < res.data.length; i++) {
      noTrainingData.style.display = "none";

      const box = document.createElement("div");
      box.id = "box";

      const destLabelWrapper = document.createElement("div");
      destLabelWrapper.innerHTML = `<span style="font-size: 12px">Label</span>: ${res.data[i].folder}`;

      const filesLength = document.createElement("span");
      filesLength.style.fontSize = "11px";
      filesLength.style.marginLeft = "6px";
      filesLength.textContent = ` (${res.data[i].files.length} files)`;

      destLabelWrapper.append(filesLength);

      box.append(destLabelWrapper);

      let destImageWrapper = document.createElement("div");
      destImageWrapper.id = "destImageWrapper";

      let andMoreText = document.createElement("div");
      andMoreText.textContent = `and ${res.data[i].files.length - 51} more...`;
      andMoreText.style.marginTop = "8px";
      andMoreText.style.fontSize = "11.5px";

      for (let j = 0; j < 51; j++) {
        let img = document.createElement("img");
        img.src = `../destDir/${res.data[i].folder}/${res.data[i].files[j]}`;
        img.id = "destDisplayImage";
        img.width = 28;
        img.style.marginRight = "4px";

        destImageWrapper.append(img);
      }

      box.append(destImageWrapper);
      box.append(andMoreText);

      destDir.append(box);
      // destLabelWrapper.append(deleteBtn);
    }
  });
}

getTrainingData();

// STARTING THE TRAINING PROCESS
const API_URL = "http://localhost:3000";

const socket = io(API_URL);

const trainBtn = document.getElementById("train");
const epoch = document.getElementById("epoch");

const labelInput = document.getElementById("labelInput");
const visual = document.getElementById("visual");

let labels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const epochWrapper = document.createElement("div");
epochWrapper.id = "epochWrapper";

const epochDisplay = document.createElement("span");

const percentage = document.createElement("span");

const progressBarWrapper = document.createElement("div");
progressBarWrapper.id = "progressBarWrapper";

const progressBar = document.createElement("div");
progressBar.id = "progressBar";

const results = document.createElement("div");
results.id = "results";

const loss = document.createElement("span");

const accuracy = document.createElement("span");

const trainingStatus = document.getElementById("trainingStatus");

const trainDisplayWrapper = document.getElementById("trainDisplayWrapper");

socket.on("yield", (message) => {
  trainingStatus.textContent = "Training has started..";
  trainDisplayWrapper.style.display = "block";
  epochDisplay.textContent = `Epoch: ${message.epoch + 1} / ${
    message.totalEpoch
  }`;
  epochWrapper.append(epochDisplay);
  epochWrapper.append(percentage);
  epochWrapper.style.marginTop = "6px";
  progressBarWrapper.style.backgroundColor = "rgb(182, 182, 182)";
  progressBar.style.width = `${parseInt(message.progress)}%`;
  percentage.textContent = `${parseInt(message.progress)}%`;
  loss.textContent = `Loss: ${message.logs.loss.toFixed(3)}`;
  accuracy.textContent = `Acc: ${message.logs.acc.toFixed(3)}`;
  loss.style.fontSize = "13px";
  accuracy.style.fontSize = "13px";
});

progressBarWrapper.append(progressBar);

let epochHistoryArr = [];
let epochHistory;

socket.on("epochEnd", (message) => {
  epochHistory = {
    epoch: message.epoch + 1,
    logs: message.logs,
  };

  epochHistoryArr.push(epochHistory);

  let historyWrapper = document.getElementById("historyWrapper");
  historyWrapper.style.overflowY = "scroll";

  completedEpoch(epochHistoryArr, message.totalEpoch);
});

results.append(accuracy);
results.append(loss);

trainDisplayWrapper.append(epochWrapper);
trainDisplayWrapper.append(progressBarWrapper);
trainDisplayWrapper.append(results);

function completedEpoch(epochHistoryArr, totalEpoch) {
  const trainDisplayWrapper = document.getElementById("trainDisplayWrapper1");

  const epochWrapper = document.createElement("div");
  epochWrapper.id = "epochWrapper";
  epochWrapper.style.marginTop = "4px";

  const epochDisplay = document.createElement("span");

  const progressBarWrapper = document.createElement("div");
  progressBarWrapper.id = "progressBarWrapper";

  const results = document.createElement("div");
  results.id = "results";

  const loss = document.createElement("span");
  const accuracy = document.createElement("span");

  for (let i = 0; i < epochHistoryArr.length; i++) {
    epochDisplay.textContent = `Epoch: ${epochHistoryArr[i].epoch} / ${totalEpoch} :`;

    epochWrapper.append(epochDisplay);

    loss.textContent = `Loss: ${epochHistoryArr[i].logs.loss.toFixed(3)}`;
    loss.style.fontSize = "13px";

    accuracy.textContent = `Acc: ${epochHistoryArr[i].logs.acc.toFixed(3)}`;
    accuracy.style.fontSize = "13px";
    console.log(epochHistoryArr);

    epochWrapper.append(loss);
    epochWrapper.append(accuracy);

    epochWrapper.style.marginTop = "4px";

    trainDisplayWrapper.append(epochWrapper);
    trainDisplayWrapper.append(progressBarWrapper);
    trainDisplayWrapper.append(results);
  }
}

function train() {
  if (epoch.value == "") {
    alert("Epoch (in number) cannot be empty..");
  } else {
    if (epoch.value < 4 || epoch.value > 150) {
      alert("Epoch range must be between 4 - 150");
    } else {
      if (datasetsLength > 1) {
        console.log("Training Started...");
        trainingStatus.style.display = "block";

        trainingStatus.textContent = "Starting training...";
        axios
          .post(`${API_URL}/train`, {
            epoch: epoch.value,
          })
          .then((res) => {
            console.log(res.data);
            if (confirm(res.data.message) == true) {
              window.location.href = "/";
            }
          });
      } else if (datasetsLength === 1) {
        alert("Minimun 2 datasets are required for training..");
      } else {
        alert("No datasets found..!!");
      }
    }
  }
}

trainBtn.addEventListener("click", train);

//*********************************************************** */

//PREDICTING THE RESULTS

// USING THE CANVAS
let canvas;
let canvasWrapper, canvasWrapper1;

let predictBtn;
let clearBtn;
let labelResults;
let btnWrapper;
let model;

const width = 380;
const height = 100;

let pX = null;
let pY = null;
let x = null;
let y = null;

let xs = [];
let ys = [];

let mouseDown = false;

const labelsRes = labels;

setup();
async function setup() {
  canvasWrapper = document.getElementById("canvasWrapper");
  canvasWrapper1 = document.getElementById("canvasWrapper1");

  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");
  canvas.id = "myCanvas";
  canvas.height = height;
  canvas.width = width;

  const data = ctx.getImageData(10, 20, 30, 30);
  console.log(data);

  canvas.addEventListener("mousemove", onMouseUpdate);
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mouseup", onMouseUp);

  btnWrapper = document.createElement("div");
  btnWrapper.id = "btnWrapper";

  clearBtn = document.createElement("button");
  clearBtn.innerHTML = "Clear";
  clearBtn.id = "clearBtn";

  let note = document.createElement("span");
  note.textContent = "Note: Try to write a digit in a single click..";
  note.style.fontSize = "12px";
  note.style.marginTop = "6px";

  btnWrapper.append(note);
  btnWrapper.append(clearBtn);

  clearBtn.addEventListener("click", clearCanvasAndResults);

  const br2 = document.createElement("br");
  const br4 = document.createElement("br");

  labelResults = document.createElement("span");
  labelResults.id = "labelResults";

  canvasWrapper.append(canvas);
  canvasWrapper.append(br2);
  canvasWrapper.append(note);
  canvasWrapper.append(btnWrapper);
  canvasWrapper.append(br4);

  canvasWrapper.append(labelResults);

  model = await tf.loadLayersModel(`${API_URL}/client/model/model.json`);

  requestAnimationFrame(draw);
}

function preProcessCanvas(image) {
  let tensor = tf.browser
    .fromPixels(image)
    .resizeNearestNeighbor([28, 28])
    .mean(2)
    .expandDims(2)
    .expandDims()
    .toFloat();

  return tensor;
}

async function predict(canvas1) {
  let tensor = preProcessCanvas(canvas1);

  let predictions = await model.predict(tensor).data();

  let results = Array.from(predictions);
  console.log(results);

  let index = results.findIndex((e) => e === 1);

  if (index == -1) {
    console.log("No match found");
  } else {
    let span = document.createElement("span");
    span.setAttribute("class", "span");
    span.innerHTML = fashionLabels[index];
    span.style.fontSize = "30px";
    span.style.marginLeft = "5px";
    labelResults.append(span);

    console.log(fashionLabels[index]);
  }
}

function clearCanvasAndResults() {
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, width, height);

  xs = [];
  ys = [];

  const elements = document.getElementsByClassName("span");
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }
}

let boundBoxXmin;
let boundBoxXmax;
let boundBoxYmin;
let boundBoxYmax;
let boundBoxHeight;
let boundBoxWidth;

function draw() {
  request = requestAnimationFrame(draw);

  if (pX == null || pY == null) {
    ctx.beginPath();
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, width, height);

    pX = x;
    pY = y;
  }

  ctx.lineWidth = 5;
  ctx.strokeStyle = "white";

  if (mouseDown === true) {
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.moveTo(x, y);
    ctx.lineTo(pX, pY);
    ctx.stroke();
  }

  xs.push(x);
  ys.push(y);

  pX = x;
  pY = y;
}

function onMouseDown(e) {
  mouseDown = true;

  xs = [];
  ys = [];
}

let canvas1 = document.createElement("canvas");

let formDataForPredictedImage = new FormData();

function onMouseUp(e) {
  mouseDown = false;

  boundBoxXmin = Math.min(...xs);
  boundBoxXmax = Math.max(...xs);
  boundBoxYmin = Math.min(...ys);
  boundBoxYmax = Math.max(...ys);
  boundBoxHeight = Math.max(...ys) - Math.min(...ys);
  boundBoxWidth = Math.max(...xs) - Math.min(...xs);

  ctx.lineWidth = 0.1;
  ctx.strokeStyle = "black";

  ctx.beginPath();

  ctx.rect(
    boundBoxXmin - 15,
    boundBoxYmin - 15,
    boundBoxWidth + 30,
    boundBoxHeight + 30
  );
  ctx.stroke();

  canvas1.width = boundBoxWidth + 30;
  canvas1.height = boundBoxHeight + 30;

  let imageData = ctx.getImageData(
    boundBoxXmin - 15,
    boundBoxYmin - 15,
    boundBoxWidth + 30,
    boundBoxHeight + 30
  );

  let ctx1 = canvas1.getContext("2d");

  ctx1.putImageData(imageData, 0, 0);

  predict(canvas1);
}

function onMouseUpdate(e) {
  const pos = getMousePos(canvas, e);
  x = pos.x;
  y = pos.y;
}

function getMousePos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

// const fashionLabels = [
//   "T-shirt/top",
//   "Trouser",
//   "Pullover",
//   "Dress",
//   "Coat",
//   "Sandal",
//   "Shirt",
//   "Sneaker",
//   "Bag",
//   "Ankle boot",
// ];

// const fashionLabels = [
//   "Ankle Boot",
//   "Bag",
//   "Coat",
//   "Dress",
//   "Pullover",
//   "Sandal",
//   "Shirt",
//   "Sneaker",
//   "T-shirt/Top",
//   "Trouser",
// ];

// const fashionLabels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const fashionLabels = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

// USING IMAGE FILE
const predictionImage = document.getElementById("predictionImage");
const predictionImageWrapper = document.getElementById(
  "predictionImageWrapper"
);
const imagePredictBtn = document.createElement("button");
imagePredictBtn.textContent = "Predict image";
const br5 = document.createElement("br");

let imageType;

predictionImage.addEventListener("change", (e) => {
  console.log(e.target.files);
  var child = predictionImageWrapper.lastElementChild;
  while (child) {
    predictionImageWrapper.removeChild(child);
    child = predictionImageWrapper.lastElementChild;
  }

  imageType = e.target.files[0].type;

  let displayPredictionImage = document.createElement("img");
  displayPredictionImage.src = URL.createObjectURL(e.target.files[0]);
  displayPredictionImage.style.height = "120px";
  displayPredictionImage.style.width = "120px";
  displayPredictionImage.style.marginTop = "10px";
  displayPredictionImage.style.marginBottom = "10px";
  predictionImageWrapper.append(displayPredictionImage);
  predictionImageWrapper.append(br5);

  predictionImageWrapper.append(imagePredictBtn);

  formDataForPredictedImage.set(
    "imageToBePredicted",
    e.target.files[0],
    e.target.files[0].name
  );
});

async function predict1() {
  axios.post(`${API_URL}/predict`, formDataForPredictedImage).then((res) => {
    console.log(fashionLabels[res.data.score]);
    canvasWrapper1.innerHTML = fashionLabels[res.data.score];
    canvasWrapper1.style.fontSize = "30px";
    canvasWrapper1.style.marginLeft = "5px";
    canvasWrapper1.style.marginTop = "20px";
  });
}

imagePredictBtn.addEventListener("click", predict1);

let chooseFileWrapper = document.getElementById("chooseFileWrapper");
let chooseFile = document.querySelectorAll('input[type="radio"]');
chooseFile.forEach((item) => {
  item.addEventListener("change", () => {
    clearCanvasAndResults();
    var child = predictionImageWrapper.lastElementChild;
    while (child) {
      predictionImageWrapper.removeChild(child);
      child = predictionImageWrapper.lastElementChild;
    }

    if (item.value === "chooseFile") {
      chooseFileWrapper.style.display = "block";
      canvasWrapper.style.display = "none";
      canvasWrapper1.style.display = "block";
    } else {
      chooseFileWrapper.style.display = "none";
      canvasWrapper.style.display = "block";
      canvasWrapper1.innerHTML = "";
      predictionImage.value = "";
    }
  });
});

//******************************************* */

// let loginBtn = document.getElementById("loginBtn");

// loginBtn.addEventListener("click", () => console.log("login"));
