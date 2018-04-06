// pixi related functions
// function to monitor file loading progress
export const loadProgressHandler = (loader, resource) => {

    //Display the file `url` currently being loaded
    console.log('loading: ' + resource.url);

    //Display the percentage of files currently loaded
    console.log('progress: ' + loader.progress + '%');

};

// grid functions

// create a 2D array from 1D array
export const createGroupedArray = (arr, chunkSize) => {
    let groups = [], i;
    for (i = 0; i < arr.length; i += chunkSize) {
        groups.push(arr.slice(i, i + chunkSize));
    }
    return groups;
};

export const scaleArray = (arr, scale=4) => {
    for (let i = 0, len = arr.length; i < len; i++) {
        let a = arr[i];
        scaleTheArray(a, scale - 1);
    }
    /* 2. Expand each of the a length */
    scaleTheArray(arr, scale - 1);

    return arr;
};

const scaleTheArray = function (arrayToScale, nTimes) {
    for (let idx = 0, i = 0, len = arrayToScale.length * nTimes; i < len; i++) {
        let elem = arrayToScale[idx];

        /* Insert the element into (idx + 1) */
        arrayToScale.splice(idx + 1, 0, elem);

        /* Add idx for the next elements */
        if ((i + 1) % nTimes === 0) {
            idx += nTimes + 1;
        }
    }
};