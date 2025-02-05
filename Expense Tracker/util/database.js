const Sequelize = require('sequelize');

const sequelize = new Sequelize('expense_tracker', 'root', 'root', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3307
});

module.exports = sequelize;
