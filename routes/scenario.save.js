const express = require('express');
const router = express.Router();
const db = require("../data/db.js");
const uuidv4 = require('uuid/v4');
const _ = require('underscore');

router.post('/', function(req, res, next) {
    // console.log(req.body);
    let newObj = _.pick(req.body,'filename', 'sceneArr');
    let dataObj = {
        ...newObj,
    };
    // res.status(200).json(dataObj);
    db.scenarioModel.create(req.body).then((instance) => {
        res.status(200).json(instance);
    }, (err) => {
        res.status(500).json(err);
    })
});

module.exports = router;