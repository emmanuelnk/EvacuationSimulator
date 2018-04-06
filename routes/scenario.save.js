const express = require('express');
const router = express.Router();
const db = require("../data/db.js");

router.post('/', function(req, res, next) {
    console.log(req.body);
    let dataObj = {
        ...req.body,
        received: true
    };
    res.status(200).json(dataObj);
    // db.scenarioModel.create(req.body).then((instance) => {
    //     res.status(200).json(instance);
    // })
});

module.exports = router;