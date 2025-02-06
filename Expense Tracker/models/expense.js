// models/user.js
const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const User = require('../models/user'); // Ensure that the path to the User model is correct


const Expense  = sequelize.define('expense', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    amount: {
        type:Sequelize.INTEGER,
        allowNull: false
    },
    description:{ 
        type:Sequelize.STRING,
        allowNull: false
    },
    category:{ 
        type:Sequelize.STRING,
        allowNull: false
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

// Set up the relationship between Expense and User
Expense.belongsTo(User, { foreignKey: 'userId' }); // Each expense belongs to one user

module.exports = Expense;