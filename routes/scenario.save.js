const express = require('express');
const router = express.Router();
const db = require("../data/db.js");
const uuidv4 = require('uuid/v4');
const _ = require('underscore');

router.post('/', function(req, res, next) {
    // console.log(req.body);
    let newObj = _.pick(req.body,'filename', 'sceneArr');
    let sceneArr = JSON.stringify(JSON.parse(newObj.sceneArr));
    let dataObj = {
        filename: newObj.filename,
        sceneArr: sceneArr
    };
    // res.status(200).json(dataObj);
    db.scenarioModel.create(dataObj).then((instance) => {
        res.status(200).json(instance);
    }, (err) => {
        res.status(500).json(err);
    })
});

module.exports = router;