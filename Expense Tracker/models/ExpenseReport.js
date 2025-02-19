// models/ExpenseReport.js
const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const ExpenseReport = sequelize.define('ExpenseReport', {
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    fileName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    fileUrl: {
        type: Sequelize.TEXT,
        allowNull: false
    }
});

module.exports = ExpenseReport;
