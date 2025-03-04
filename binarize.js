function computeIntegralImage(data, width, height) {
  const integral = new Uint32Array(width * height);

  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      sum += data[idx];
      integral[y * width + x] = (y > 0 ? integral[(y - 1) * width + x] : 0) + sum;
    }
  }

  return integral;
}

function getAreaSum(integral, width, x1, y1, x2, y2) {
  const a = x1 > 0 && y1 > 0 ? integral[(y1 - 1) * width + (x1 - 1)] : 0;
  const b = y1 > 0 ? integral[(y1 - 1) * width + x2] : 0;
  const c = x1 > 0 ? integral[y2 * width + (x1 - 1)] : 0;
  const d = integral[y2 * width + x2];
  return d - b - c + a;
}

function adaptiveThresholdSimple(imageData, blockSize, C) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new ImageData(width, height);
  const outputData = output.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;

      //local mean
      for (let dy = -blockSize; dy <= blockSize; dy++) {
        for (let dx = -blockSize; dx <= blockSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            sum += data[idx];
            count++;
          }
        }
      }

      const threshold = (sum / count) - C;
      const idx = (y * width + x) * 4;
      const pixelValue = data[idx];

      // binarize
      outputData[idx] = outputData[idx + 1] = outputData[idx + 2] = pixelValue > threshold ? 255 : 0;
      outputData[idx + 3] = 255; // Alpha channel
    }
  }
  return output;
}


function adaptiveThreshold(imageData, blockSize, C) {
  console.log("adaptiveThreshold");
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new ImageData(width, height);
  const outputData = output.data;

  const integral = computeIntegralImage(data, width, height);

  const halfBlock = Math.floor(blockSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(x - halfBlock, 0);
      const y1 = Math.max(y - halfBlock, 0);
      const x2 = Math.min(x + halfBlock, width - 1);
      const y2 = Math.min(y + halfBlock, height - 1);

      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum = getAreaSum(integral, width, x1, y1, x2, y2);
      const threshold = (sum / area) - C;

      const idx = (y * width + x) * 4;
      const pixelValue = data[idx];
      outputData[idx] = outputData[idx + 1] = outputData[idx + 2] = pixelValue > threshold ? 255 : 0;
      outputData[idx + 3] = 255; // Alpha channel
    }
  }
  return output;
}

onmessage = (e) => {
  let data = e.data;
  let imageData;
  if (data.useIntegralImage) {
    imageData = adaptiveThreshold(data.imageData, data.blockSize, data.C);
  }else{
    imageData = adaptiveThresholdSimple(data.imageData, data.blockSize, data.C);
  }
  postMessage({imageData:imageData,imageIndex:data.imageIndex});
};
