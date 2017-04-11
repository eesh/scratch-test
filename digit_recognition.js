/**

  Digit recognition script that uses a single hidden layer neural network that is already trained.

*/

// Import math library for matrix operations
$.getScript('https://eesh.github.io/scratch-test/math.min.js', checkMathLibrary);

var k = 10; // 10 digits
var theta = getTheta();

function checkMathLibrary() {
  if (math == undefined) {
    console.log("Math library is not loaded");
  } else {
    console.log("Math library loaded.");
  }
}

function augmentFeatureVector(X) {
  columnOfOnes = math.zeros(math.size(X)[0], 1) + 1;
  return math.concat(columnOfOnes, X);
}

function computeProbabilities(X, theta, tempParameter) {
  X = math.transpose(X);
  var z = math.multiply(theta, X);
  z = math.transpose(z) / tempParameter;
  var H = np.zeros(math.size(z));
  for (var j in math.range(math.size(z)[0])) {
    var c = max(z[j]);
    H[j] = math.exp(z[j]-c) / math.sum(math.exp(z[j]-c));
  }
  return math.transpose(H);
}

function getClassification(X, theta, tempParameter) {
  X = augmentFeatureVector(X)
  var probabilities = computeProbabilities(X, theta, tempParameter)
  return math.max(probabilities);
}


function computeLoss(X, Y, theta, lambdaFactor, tempParameter) {
  var c = 0;
  var n = math.size(X)[0];
  var k = math.size(theta)[0];
  var d = math.size(X)[1];
  var H = computeProbabilities(X, theta, tempParameter);
  var sum = 0;
  for (var i in math.range(0, n)) {
    for (var j in math.range(0, k)) {
      if(j == Y[i]) {
        var log = math.log(H[j][i]);
        sum += log;
      }
    }
  }
  var regularizationSum = math.sum(math.multiply(theta, theta));
  var Loss = (-sum/n) + ((lambdaFactor/2)*regularizationSum);
  return Loss;
}


function runGradientDescentIteration(X, Y, theta, alpha, lambdaFactor, tempParameter) {
    var H = computeProbabilities(X, theta, tempParameter);
    var n = math.size(X)[0];
    var k = math.size(theta)[0];
    var d = math.size(X)[1];
    for (var j in math.range(0, k)) {
        lossSum = math.zeros(1, d);
        for (var i in math.range(n)) {
            loss = 0;
            if(j == Y[i]) {
                loss = 1;
            }
            lossSum = lossSum + X[i] * (loss - H[j][i]);
        }
        theta[j] = (1 - (lambdaFactor * alpha)) * theta[j] + (alpha / (n * tempParameter)) * (lossSum);
    }
    return theta;
}

function getTheta() {
  var theta = [];
  return t;
}
