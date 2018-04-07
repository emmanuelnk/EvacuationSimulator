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

export const scaleSpread = (array, factor) => {
    const scaled = [];

    for(const row of array) {
        x = [];

        for(const item of row)
            x.push(...Array(factor).fill(item));

        scaled.push(...Array(factor).fill(x));
    }

    return scaled;
};

export const scaleApply = (array, factor) => {
    const scaled = [];

    for(const row of array) {
        let x = [];

        for(const item of row)
            x.push.apply(x, Array(factor).fill(item));

        scaled.push.apply(scaled, Array(factor).fill(x));
    }

    return scaled;
};

export const scaleConcat = (array, factor) => {
    let scaled = [];

    for(const row of array) {
        let x = [];

        for(const item of row)
            x = x.concat(Array(factor).fill(item));

        scaled = scaled.concat(Array(factor).fill(x));
    }

    return scaled;
};