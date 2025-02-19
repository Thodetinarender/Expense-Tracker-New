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
    type: {
        type: Sequelize.STRING, // income or expense
        allowNull: false
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

// Define the relationship: One User -> Many Expenses
User.hasMany(Expense, { foreignKey: 'userId', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'userId' });

module.exports = Expense;