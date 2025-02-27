function convertToGrayscale(r, g, b) {
  return (r * 6966 + g * 23436 + b * 2366) >> 15;
}

function binarize(imageData,threshold){
  const pixels = imageData.data; //[r,g,b,a,...]
  const grayscaleValues = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];
    const grayscale = convertToGrayscale(red, green, blue);
    grayscaleValues.push(grayscale);
  }
  let grayscaleIndex = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = grayscaleValues[grayscaleIndex];
    grayscaleIndex = grayscaleIndex + 1;
    let value = 255;
    if (gray < threshold) {
      value = 0;
    }
    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
  }
}

onmessage = (e) => {
  console.log(e);
  console.log("Message received from main script");
  let data = e.data;
  binarize(data.imageData, data.threshold);
  console.log("Posting message back to main script");
  postMessage({imageData:data.imageData});
};