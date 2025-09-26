const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor(dbPath = null) {
    this.db = null ;
  }

  connect() {
    return new Promise((resolve, reject) => {
      //const dbPath = path.join(__dirname, '../../data/tasks.db');
      //use in memory databases for tests or provided path, otherwise use production path
      const finalDbPath = this.dbPath ||(process.env.NODE_ENV === 'test'? 'memory.db':path.join(__dirname, '../../data/tasks.db'));
      //this.db = new sqlite3.Database(dbPath, (err) => {
        this.db = new sqlite3.Database(finalDbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else{ 
          if (finalDbPath === 'memory.db') {
            console.log('Connected to in memory sqllite database for testing')
          }
        else {
          console.log('Connected to SQLite database');
        }
          this.initializeTables().then(resolve).catch(reject);
        }
      });
    });
  }

  initializeTables() {
    return new Promise((resolve, reject) => {
      const createTasksTable = `
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
          due_date DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createTasksTable, (err) => {
        if (err) {
          console.error('Error creating tasks table:', err.message);
          reject(err);
        } else {
          console.log('Tasks table initialized');
          resolve();
        }
      });
    });
  }

  // Create a new task
  createTask(task) {
    return new Promise((resolve, reject) => {
      const { title, description, status, due_date } = task;
      const sql = `
        INSERT INTO tasks (title, description, status, due_date)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(sql, [title, description === undefined ? null : description, status, due_date], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            title, 
            description: description === undefined ? null : description, 
            status, 
            due_date 
          });
        }
      });
    });
  }

  // Get task by ID
  getTaskById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM tasks WHERE id = ?';
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get all tasks
  getAllTasks() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM tasks ORDER BY due_date ASC';
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Update task status
  updateTaskStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE tasks 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      this.db.run(sql, [status, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Task not found'));
        } else {
          resolve({ id, status, updated: true });
        }
      });
    });
  }

  // Update entire task
  updateTask(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      Object.keys(updates).forEach(key => {
        if (['title', 'description', 'status', 'due_date'].includes(key)) {
          fields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });
      
      if (fields.length === 0) {
        reject(new Error('No valid fields to update'));
        return;
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
      
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Task not found'));
        } else {
          resolve({ id, ...updates, updated: true });
        }
      });
    });
  }

  // Delete task
  deleteTask(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM tasks WHERE id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Task not found'));
        } else {
          resolve({ id, deleted: true });
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;
