import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(__dirname, '..', '..', 'data', 'scaffold.db');
let dbInstance = null;
const getDb = async () => {
    if (dbInstance)
        return dbInstance;
    dbInstance = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });
    await dbInstance.run('PRAGMA foreign_keys = ON');
    return dbInstance;
};
// Create tables on initialization
const initDb = async () => {
    try {
        const database = await getDb();
        // Users table
        await database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        otp TEXT,
        otpExpiresAt TEXT,
        otpFailedAttempts INTEGER DEFAULT 0,
        otpLockoutUntil TEXT,
        resetToken TEXT,
        resetTokenExpiresAt TEXT
      );
    `);
        // Alter table dynamically if columns are missing
        try {
            await database.exec('ALTER TABLE users ADD COLUMN resetToken TEXT');
        }
        catch (_) { }
        try {
            await database.exec('ALTER TABLE users ADD COLUMN resetTokenExpiresAt TEXT');
        }
        catch (_) { }
        // Projects table
        await database.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        ownerId TEXT NOT NULL,
        isPublic INTEGER DEFAULT 1,
        tailwindConfig TEXT,
        createdAt TEXT NOT NULL
      );
    `);
        // Components table
        await database.exec(`
      CREATE TABLE IF NOT EXISTS components (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        props TEXT DEFAULT '[]',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
        console.log('🚀 SQLite database initialized/verified successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize SQLite database:', error);
    }
};
initDb();
export const db = {
    // Users
    getUsers: async () => {
        const database = await getDb();
        const rows = await database.all('SELECT * FROM users');
        return rows;
    },
    getUserById: async (id) => {
        const database = await getDb();
        const row = await database.get('SELECT * FROM users WHERE id = ?1', [id]);
        return row;
    },
    getUserByUsername: async (username) => {
        const database = await getDb();
        const row = await database.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?1)', [username]);
        return row;
    },
    getUserByEmail: async (email) => {
        const database = await getDb();
        const row = await database.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?1)', [email]);
        return row;
    },
    addUser: async (user) => {
        const database = await getDb();
        await database.run(`INSERT INTO users (id, username, email, passwordHash, createdAt, otp, otpExpiresAt, otpFailedAttempts, otpLockoutUntil, resetToken, resetTokenExpiresAt) 
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`, [
            user.id,
            user.username,
            user.email,
            user.passwordHash,
            user.createdAt,
            user.otp || null,
            user.otpExpiresAt || null,
            user.otpFailedAttempts || 0,
            user.otpLockoutUntil || null,
            user.resetToken || null,
            user.resetTokenExpiresAt || null
        ]);
    },
    updateUser: async (userId, updates) => {
        const database = await getDb();
        const keys = Object.keys(updates);
        if (keys.length === 0)
            return db.getUserById(userId);
        const setClause = keys.map((key) => `${key} = ?`).join(', ');
        const values = keys.map(key => updates[key]);
        await database.run(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, userId]);
        return db.getUserById(userId);
    },
    // Projects
    getProjects: async () => {
        const database = await getDb();
        const rows = await database.all('SELECT * FROM projects');
        return rows.map(r => ({
            ...r,
            isPublic: r.isPublic === 1
        }));
    },
    getProjectById: async (id) => {
        const database = await getDb();
        const row = await database.get('SELECT * FROM projects WHERE id = ?1', [id]);
        if (!row)
            return undefined;
        return {
            ...row,
            isPublic: row.isPublic === 1
        };
    },
    getProjectsByOwner: async (ownerId) => {
        const database = await getDb();
        const rows = await database.all('SELECT * FROM projects WHERE ownerId = ?1', [ownerId]);
        return rows.map(r => ({
            ...r,
            isPublic: r.isPublic === 1
        }));
    },
    addProject: async (project) => {
        const database = await getDb();
        await database.run(`INSERT INTO projects (id, name, description, ownerId, isPublic, tailwindConfig, createdAt) 
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`, [
            project.id,
            project.name,
            project.description,
            project.ownerId,
            project.isPublic ? 1 : 0,
            project.tailwindConfig || null,
            project.createdAt
        ]);
    },
    updateProject: async (projectId, updates) => {
        const database = await getDb();
        const keys = Object.keys(updates);
        if (keys.length === 0)
            return db.getProjectById(projectId);
        const setClause = keys.map((key) => `${key} = ?`).join(', ');
        const values = keys.map(key => {
            const val = updates[key];
            if (key === 'isPublic')
                return val ? 1 : 0;
            return val;
        });
        await database.run(`UPDATE projects SET ${setClause} WHERE id = ?`, [...values, projectId]);
        return db.getProjectById(projectId);
    },
    deleteProject: async (projectId) => {
        const database = await getDb();
        await database.run('DELETE FROM components WHERE projectId = ?1', [projectId]);
        const res = await database.run('DELETE FROM projects WHERE id = ?1', [projectId]);
        return (res.changes ?? 0) > 0;
    },
    // Components
    getComponents: async (projectId) => {
        const database = await getDb();
        const rows = await database.all('SELECT * FROM components WHERE projectId = ?1', [projectId]);
        return rows.map(r => ({
            ...r,
            props: r.props ? JSON.parse(r.props) : []
        }));
    },
    getComponentById: async (id) => {
        const database = await getDb();
        const row = await database.get('SELECT * FROM components WHERE id = ?1', [id]);
        if (!row)
            return undefined;
        return {
            ...row,
            props: row.props ? JSON.parse(row.props) : []
        };
    },
    addComponent: async (component) => {
        const database = await getDb();
        await database.run(`INSERT INTO components (id, projectId, name, description, code, props, createdAt, updatedAt) 
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`, [
            component.id,
            component.projectId,
            component.name,
            component.description,
            component.code,
            JSON.stringify(component.props),
            component.createdAt,
            component.updatedAt
        ]);
    },
    updateComponent: async (componentId, updates) => {
        const database = await getDb();
        const keys = Object.keys(updates);
        if (keys.length === 0)
            return db.getComponentById(componentId);
        const updatedAt = new Date().toISOString();
        const allUpdates = { ...updates, updatedAt };
        const allKeys = Object.keys(allUpdates);
        const setClause = allKeys.map((key) => `${key} = ?`).join(', ');
        const values = allKeys.map(key => {
            const val = allUpdates[key];
            return typeof val === 'object' ? JSON.stringify(val) : val;
        });
        await database.run(`UPDATE components SET ${setClause} WHERE id = ?`, [...values, componentId]);
        return db.getComponentById(componentId);
    },
    deleteComponent: async (componentId) => {
        const database = await getDb();
        const res = await database.run('DELETE FROM components WHERE id = ?1', [componentId]);
        return (res.changes ?? 0) > 0;
    }
};
//# sourceMappingURL=db.js.map