const Interaction = require('../models/Interaction');

/**
 * Log a user interaction to the database
 * @param {Object} params
 * @param {Object} params.user - User document or req.user
 * @param {String} params.action - Action identifier
 * @param {String} params.category - Action category
 * @param {String|ObjectId} [params.entityId] - Target entity ID
 * @param {String} [params.entityModel] - Model name of target entity
 * @param {String} [params.details] - Human-readable description
 * @param {Object} [params.metadata] - Extra metadata key-values
 */
const logInteraction = async ({
  user,
  action,
  category,
  entityId = null,
  entityModel = null,
  details = '',
  metadata = {}
}) => {
  try {
    if (!user) return;

    await Interaction.create({
      user: user._id || user.id,
      userName: user.name || 'Unknown User',
      userRole: user.role || 'student',
      action,
      category,
      entityId,
      entityModel,
      details,
      metadata
    });
  } catch (err) {
    // Silent fail for logging so main business logic is never blocked
    console.error('Interaction logging warning:', err.message);
  }
};

module.exports = { logInteraction };

