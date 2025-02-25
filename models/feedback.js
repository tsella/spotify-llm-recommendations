const path = require('path');

class Feedback {
  constructor() {
    // We'll use the db from app.locals in the routes
  }

  // Create a new feedback entry
  create(db, feedbackData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO feedback (userId, recommendationId, itemType, itemId, itemName, liked, comments, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(
        sql,
        [
          feedbackData.userId,
          feedbackData.recommendationId,
          feedbackData.itemType,
          feedbackData.itemId,
          feedbackData.itemName,
          feedbackData.liked ? 1 : 0,
          feedbackData.comments || null,
          new Date().toISOString()
        ],
        function(err) {
          if (err) {
            console.error('Error creating feedback:', err);
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  // Find feedback entries for a user
  find(db, conditions, options = {}) {
    return new Promise((resolve, reject) => {
      const { userId } = conditions;
      const limit = options.limit || 100;
      
      const sql = `
        SELECT * FROM feedback 
        WHERE userId = ? 
        ORDER BY createdAt DESC
        LIMIT ?
      `;
      
      db.all(sql, [userId, limit], (err, rows) => {
        if (err) {
          console.error('Error finding feedback:', err);
          reject(err);
        } else {
          // Convert SQLite integer back to boolean
          const feedback = rows.map(row => ({
            ...row,
            liked: Boolean(row.liked)
          }));
          
          resolve(feedback);
        }
      });
    });
  }
}

module.exports = new Feedback();