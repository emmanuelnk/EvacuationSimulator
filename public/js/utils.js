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

export class msgConsole {
    constructor (obj) {
        this.div = obj.id;
        this.animated = obj.animated;
        this.animateCssClass = obj.animateCssClass;
        this.showTime = obj.showTime;
    }

    msg (message) {
        let animated = this.animated ? 'animated' : '';
        let disp = this.showTime ? '' : 'display:none';
        let messages = document.getElementById(this.div);
        let isScrolledToBottom = messages.scrollHeight - messages.clientHeight <= messages.scrollTop + 1;
        let time = moment().format('HH:mm:ss');

        $(`#${this.div} .mc-cursor`).before(`<div class="mc-row ${animated} ${this.animateCssClass}"><span class="mc-time"><span style=${disp}>${time}</span> &lambda;</span><span class="mc-msg">${message}</span></div>`);


        if(isScrolledToBottom){
            messages.scrollTop = messages.scrollHeight - messages.clientHeight;
        }
    }

    clr (str, color) {
        let spClr =
            color === 'err' ? 'red' :
                color === 'success' ? 'darkgreen' :
                    color === 'warn' ? 'yellow' :
                        color === 'monoorange' ? '#FD971F' :
                            color === 'monoblue' ? '#66D9EF' :
                                color === 'monopink' ? '#F92672' :
                                    color === 'monogreen' ? '#A6E22E' :
                                        color;
        return `<span style="color:${spClr}">${str}</span>`;
    }
}

export class msgTicker {
    constructor (obj) {
        this.div = obj.id;
        this.animated = obj.animated;
        this.animateCssClass = obj.animateCssClass;
    }

    msg (message) {
        let animated = this.animated ? 'animated' : '';
        $(`#${this.div}`).empty().html(`<p class="${animated} ${this.animateCssClass}">> ${message}</p>`);
    }

    clr (str, color) {
        let spClr =
            color === 'err' ? 'red' :
                color === 'success' ? 'darkgreen' :
                    color === 'warn' ? 'yellow' :
                        color === 'monoorange' ? '#FD971F' :
                            color === 'monoblue' ? '#66D9EF' :
                                color === 'monopink' ? '#F92672' :
                                    color === 'monogreen' ? '#A6E22E' :
                                        color;
        return `<span style="color:${spClr}">${str}</span>`;
    }
}