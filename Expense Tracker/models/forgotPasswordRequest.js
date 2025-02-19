const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const User = require('../models/user');

const ForgotPasswordRequest = sequelize.define('forgotPasswordRequest', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4, // Sequelize generates UUID
        allowNull: false,
        primaryKey: true
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
});

// Set up the relationship
ForgotPasswordRequest.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ForgotPasswordRequest, { foreignKey: 'userId' });

// Correct CommonJS export
module.exports = ForgotPasswordRequest;
