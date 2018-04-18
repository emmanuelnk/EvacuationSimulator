const Rainbow = require('rainbowvis.js');
const rainbow = new Rainbow();
const PNGImage = require('pnglib-es6');

let num = 30;
let colorArr = [];
let imageUrls =[];
rainbow.setNumberRange(1, num);
rainbow.setSpectrum('yellow', 'red','black');


for(let i = 0; i < num; i++ ) {
    let color = rainbow.colourAt(i);
    colorArr.push(`#{color}`);
}

colorArr.forEach((el)=>{
    let image = new PNGImage(4, 4, 8,el);
    let dataUri = image.getDataURL();
    imageUrls.push(dataUri);
});