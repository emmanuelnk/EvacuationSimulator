const express = require('express');
const router = express.Router();
const db = require("../data/db.js");
const sequelize = require('sequelize');

router.post('/', function(req, res, next) {
    if (req.body.action === 'delete') {
        db.scenarioModel.destroy({
            where: {
                id: req.body.id
            }
        }).then((rowDeleted) => {
            console.log('rowDeleted: ', rowDeleted);
            if (rowDeleted === 1) {
                return db.scenarioModel.findAll();
            } else {
                throw new Error({err:'Something went wrong when deleting the row!'})
            }
        }).then((instanceArr) => {
            if(instanceArr.length > 0) {
                res.status(200).json(instanceArr);
            } else {
                res.status(200).json([]);
            }
        }).catch((err) => {
            res.status(400).json(err);
        })
    } else {
        res.status(400).json('Bad Request!');
    }

});

module.exports = router;