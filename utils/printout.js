const fs = require('fs');
let mainGrid = Array(50).fill().map(() => Array(50).fill(0));

for (let i = 0; i < 50; i+=10) {
    for (let j =0; j < 50; j+=10) {
        if((i/10)%2 === 0) {
            if(j+5 < 50)
            mainGrid[i][j+5] = 6;
        }else {
            mainGrid[i][j] = 6;
        }

    }
}

fs.writeFile('test.json', JSON.stringify({ data:mainGrid }));
