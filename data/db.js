const Sequelize = require('sequelize');

// initialize our database
const db = new Sequelize('whistle', null, null, {
    dialect: 'sqlite',
    storage: './esm.sqlite',
    logging: false, // mark this true if you want to see logs
});

const scenarioModel = db.define('scenarioModel', {
    name: { type: Sequelize.STRING },
    mainGrid: {type: Sequelize.BLOB}
});

module.exports = db;