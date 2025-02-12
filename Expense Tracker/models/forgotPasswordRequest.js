import { Sequelize } from 'sequelize';
import sequelize from '../util/database.js';
import User from './user.js';
import { v4 as uuidv4 } from 'uuid';

const ForgotPasswordRequest = sequelize.define('forgotPasswordRequest', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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

export default ForgotPasswordRequest;