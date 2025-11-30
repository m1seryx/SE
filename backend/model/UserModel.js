const db = require('../config/db');

const User = {
  create: (first_name, last_name, username, email, password, phone_number, callback) => {
    const sql = "INSERT INTO user (first_name, last_name, username, email, password, phone_number) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [first_name, last_name, username, email, password, phone_number], callback);
  },
  
  findByUsername: (username, callback) =>{
  const sql = "SELECT * FROM user WHERE username = ?";
  db.query(sql, [username], callback);
},
  
  findByEmail: (email, callback) => {
    const sql = "SELECT * FROM user WHERE email = ?";
    db.query(sql, [email], callback);
  },

  findById: (user_id, callback) => {
    const sql = "SELECT user_id, first_name, last_name, username, email, phone_number, profile_picture FROM user WHERE user_id = ?";
    db.query(sql, [user_id], callback);
  },
  
  createGoogleUser: (first_name, last_name, email, google_id, callback) => {
    
    const username = email.split('@')[0] + '_' + Date.now().toString().slice(-6);
   
    const sql = "INSERT INTO user (first_name, last_name, username, email, password, phone_number, google_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [first_name, last_name, username, email, null, null, google_id], callback);
  },

  updateProfilePicture: (user_id, profile_picture_path, callback) => {
    const sql = "UPDATE user SET profile_picture = ? WHERE user_id = ?";
    db.query(sql, [profile_picture_path, user_id], callback);
  },

  update: (user_id, first_name, last_name, email, phone_number, profile_picture, callback) => {
    if (profile_picture) {
      const sql = "UPDATE user SET first_name = ?, last_name = ?, email = ?, phone_number = ?, profile_picture = ? WHERE user_id = ?";
      db.query(sql, [first_name, last_name, email, phone_number, profile_picture, user_id], callback);
    } else {
      const sql = "UPDATE user SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE user_id = ?";
      db.query(sql, [first_name, last_name, email, phone_number, user_id], callback);
    }
  }

};
module.exports = User;