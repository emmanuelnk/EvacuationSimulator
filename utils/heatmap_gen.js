let mainGrid = Array(50).fill().map(() => Array(50).fill(0));
let subGrid = Array(50).fill().map(() => Array(50).fill(0));
subGridCurr = subGrid.map(function(arr) {return arr.slice();});

let exits = [{y:15,x:0},{y:24,x:49},{y:34,x:49},{y:0,x:25}];
exits.forEach((exit)=>{
    mainGrid[exit.y][exit.x] = -1;
});

for (let y = 0; y < mainGrid.length; y++) {
    for (let x =0; x < mainGrid[y].length; x++) {
        function findingNeighbors(i, j) {
            let rowLimit = subGrid.length-1;
            let columnLimit = subGrid[0].length-1;
            let neighborArr = [];
            let pmax = 4,
                pmin = 1;

            for(let y = Math.max(0, i-1); y <= Math.min(i+1, rowLimit); y++) {
                for(let x = Math.max(0, j-1); x <= Math.min(j+1, columnLimit); x++) {
                    neighborArr.push({y:y,x:x});
                }
            }
            increaseIntensity(neighborArr);
        }
    }
}
