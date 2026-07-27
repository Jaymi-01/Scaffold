import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
// Initial database state if file doesn't exist
const initialData = {
    users: [],
    projects: [],
    components: []
};
// Read database file
function readDb() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            writeDb(initialData);
            return initialData;
        }
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error('Error reading database, resetting to initial state:', error);
        return initialData;
    }
}
// Write database file atomically
function writeDb(data) {
    try {
        const tempFile = `${DB_FILE}.tmp`;
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tempFile, DB_FILE);
    }
    catch (error) {
        console.error('Error writing to database:', error);
    }
}
// Database helper functions
export const db = {
    // Users
    getUsers: () => readDb().users,
    getUserById: (id) => {
        return readDb().users.find(u => u.id === id);
    },
    getUserByUsername: (username) => {
        return readDb().users.find(u => u.username.toLowerCase() === username.toLowerCase());
    },
    getUserByEmail: (email) => {
        return readDb().users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    addUser: (user) => {
        const data = readDb();
        data.users.push(user);
        writeDb(data);
    },
    updateUser: (userId, updates) => {
        const data = readDb();
        const index = data.users.findIndex(u => u.id === userId);
        if (index === -1)
            return undefined;
        data.users[index] = {
            ...data.users[index],
            ...updates
        };
        writeDb(data);
        return data.users[index];
    },
    // Projects
    getProjects: () => readDb().projects,
    getProjectById: (id) => {
        return readDb().projects.find(p => p.id === id);
    },
    getProjectsByOwner: (ownerId) => {
        return readDb().projects.filter(p => p.ownerId === ownerId);
    },
    addProject: (project) => {
        const data = readDb();
        data.projects.push(project);
        writeDb(data);
    },
    updateProject: (projectId, updates) => {
        const data = readDb();
        const index = data.projects.findIndex(p => p.id === projectId);
        if (index === -1)
            return undefined;
        data.projects[index] = {
            ...data.projects[index],
            ...updates
        };
        writeDb(data);
        return data.projects[index];
    },
    deleteProject: (projectId) => {
        const data = readDb();
        const beforeCount = data.projects.length;
        data.projects = data.projects.filter(p => p.id !== projectId);
        // Also delete associated components
        data.components = data.components.filter(c => c.projectId !== projectId);
        writeDb(data);
        return data.projects.length < beforeCount;
    },
    // Components
    getComponents: (projectId) => {
        return readDb().components.filter(c => c.projectId === projectId);
    },
    getComponentById: (id) => {
        return readDb().components.find(c => c.id === id);
    },
    addComponent: (component) => {
        const data = readDb();
        data.components.push(component);
        writeDb(data);
    },
    updateComponent: (componentId, updates) => {
        const data = readDb();
        const index = data.components.findIndex(c => c.id === componentId);
        if (index === -1)
            return undefined;
        data.components[index] = {
            ...data.components[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        writeDb(data);
        return data.components[index];
    },
    deleteComponent: (componentId) => {
        const data = readDb();
        const beforeCount = data.components.length;
        data.components = data.components.filter(c => c.id !== componentId);
        writeDb(data);
        return data.components.length < beforeCount;
    }
};
//# sourceMappingURL=db.js.map