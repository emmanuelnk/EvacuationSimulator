const express = require('express');
const router = express.Router();
const db = require("../data/db.js");
const sequelize = require('sequelize');

router.post('/', function(req, res, next) {
    if (req.body.action === 'files') {
        db.scenarioModel.findAll().then((instanceArr) => {
            if(instanceArr.length > 0) {
                res.status(200).json(instanceArr);
            } else {
                res.status(200).json([]);
            }

        }, (err) => {
            res.status(500).json(err);
        })
    } else {
        res.status(400).json('Bad Request!');
    }

});

module.exports = router;