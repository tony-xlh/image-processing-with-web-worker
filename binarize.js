function convertToGrayscale(r, g, b) {
  return (r * 6966 + g * 23436 + b * 2366) >> 15;
}

//only update the value of the center pixel
function binarize(imageData,blockSize){
  const centerIndex = Math.ceil(blockSize * blockSize / 2);
  const pixels = imageData.data; //[r,g,b,a,...]
  //console.log(pixels);
  const grayscaleValues = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];
    const grayscale = convertToGrayscale(red, green, blue);
    grayscaleValues.push(grayscale);
  }
  let threshold = calculateMean(grayscaleValues);
  //console.log(threshold);
  let grayscaleIndex = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (grayscaleIndex === centerIndex) {
      const gray = grayscaleValues[grayscaleIndex];
      let value = 255;
      if (gray < threshold) {
        value = 0;
      }
      return value;
    }
    grayscaleIndex = grayscaleIndex + 1;
  }
  console.log("wrong value");
  console.log("grayscaleIndex",grayscaleIndex);
  console.log("centerIndex",centerIndex);
  return -1;
}

function calculateMean(grayscaleValues) {
  let sum = 0;
  for (let i = 0; i < grayscaleValues.length; i++) {
    sum += grayscaleValues[i];
  }
  return sum / grayscaleValues.length;
}

onmessage = (e) => {
  //console.log(e);
  //console.log("Message received from main script");
  let data = e.data;
  let value = binarize(data.imageData, data.blockSize);
  //console.log("Posting message back to main script");
  postMessage({value: value, pixelIndex:data.pixelIndex});
};
