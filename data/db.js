const Sequelize = require('sequelize');

// initialize our database
const db = new Sequelize('whistle', null, null, {
    dialect: 'sqlite',
    storage: './esm.sqlite',
    logging: false, // mark this true if you want to see logs
});

const scenarioModel = db.define('scenarioModel', {
    filename: { type: Sequelize.STRING },
    sceneArr: {type: Sequelize.STRING}
});

db.scenarioModel = db.models.scenarioModel;
module.exports = db;