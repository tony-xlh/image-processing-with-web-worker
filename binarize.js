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

  if (threshold === -1) {
    threshold = calculateMean(grayscaleValues);
  }

  console.log("threshold", threshold);
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

function calculateMean(grayscaleValues) {
  let sum = 0;
  for (let i = 0; i < grayscaleValues.length; i++) {
    sum += grayscaleValues[i];
  }
  return sum / grayscaleValues.length;
}

onmessage = (e) => {
  console.log(e);
  console.log("Message received from main script");
  let data = e.data;
  binarize(data.imageData, data.threshold);
  console.log("Posting message back to main script");
  postMessage({imageData:data.imageData, index:data.index});
};

const histo = (data, bins) =>
  data.reduce((arr, e) => {
    arr[bins.indexOf(e)] += 1;
    return arr;
  }, [...Array(bins.length)].fill(0));

const width = (hist, s, e) => {
  let v = 0;
  for (let i = s; i < e; i += 1) {
    v += hist[i];
  }
  return v;
};

const bins = data => Array.from(new Set(data)).sort((e0, e1) => e0 - e1);

const weight = (hist, s, e, total) => {
  let v = 0;
  for (let i = s; i < e; i += 1) {
    v += hist[i];
  }
  return v / total;
};

const mean = (hist, bins, s, e, width) => {
  let v = 0;
  for (let i = s; i < e; i += 1) {
    v += hist[i] * bins[i];
  }
  return v * width;
};

const variance = (hist, bins, s, e, mean, width) => {
  let v = 0;
  for (let i = s; i < e; i += 1) {
    const d = bins[i] - mean;
    v += d * d * hist[i];
  }
  return v * width;
};

const cross = (wb, vb, wf, vf) => wb * vb + wf * vf;

function ostu(data) {
  const b = bins(data);
  const h = histo(data, b);
  const { length: total } = data;
  const vars = [...Array(b.length)].map((_, i) => {
    const s0 = 0;
    const e0 = i;
    const s1 = i;
    const e1 = h.length;

    const w0 = 1 / width(h, s0, e0);
    const w1 = 1 / width(h, s1, e1);

    const wb = weight(h, s0, e0, total);
    const vb = variance(h, b, s0, e0, mean(h, b, s0, e0, w0), w0);

    const wf = weight(h, s1, e1, total);
    const vf = variance(h, b, s1, e1, mean(h, b, s1, e1, w1), w1);

    const x = cross(wb, vb, wf, vf);

    return !isNaN(x) ? x : Number.POSITIVE_INFINITY;
  });

  return b[vars.indexOf(Math.min(...vars))];
};
