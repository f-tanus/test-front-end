const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILES = {
    produtos: path.join(DATA_DIR, 'produtos.json'),
    materiais: path.join(DATA_DIR, 'materiais.json'),
    vendas: path.join(DATA_DIR, 'vendas.json'),
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize empty JSON files if they don't exist
Object.values(DATA_FILES).forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '[]', 'utf-8');
    }
});

/**
 * Simple JSON File Database
 * Mimics MongoDB-like operations using flat JSON files
 */
const DB = {
    /**
     * Read all documents from a collection
     */
    findAll(collection) {
        try {
            const raw = fs.readFileSync(DATA_FILES[collection], 'utf-8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    },

    /**
     * Find documents matching a filter
     */
    findWhere(collection, filter = {}) {
        const data = this.findAll(collection);
        if (Object.keys(filter).length === 0) return data;
        return data.filter(item => {
            return Object.entries(filter).every(([key, value]) => {
                if (key === '$expr') {
                    // Handle $expr operators
                    return Object.entries(value).every(([op, condition]) => {
                        if (op === '$lte') {
                            const [field1, field2] = Object.entries(condition)[0];
                            return item[field1] <= item[field2];
                        }
                        return true;
                    });
                }
                if (typeof value === 'object' && value !== null) {
                    if (value.$gte !== undefined && value.$lte !== undefined) {
                        return item[key] >= new Date(value.$gte) && item[key] <= new Date(value.$lte);
                    }
                    if (value.$gte !== undefined) {
                        return new Date(item[key]) >= new Date(value.$gte);
                    }
                    if (value.$lte !== undefined) {
                        return new Date(item[key]) <= new Date(value.$lte);
                    }
                }
                if (key === 'dataVenda' && typeof value === 'object') {
                    const itemDate = new Date(item[key]).getTime();
                    if (value.$gte) {
                        const gte = new Date(value.$gte).getTime();
                        if (itemDate < gte) return false;
                    }
                    if (value.$lte) {
                        const lte = new Date(value.$lte).getTime();
                        if (itemDate > lte) return false;
                    }
                    return true;
                }
                return item[key] === value;
            });
        });
    },

    /**
     * Find one document by id
     */
    findById(collection, id) {
        const data = this.findAll(collection);
        return data.find(item => item._id === id) || null;
    },

    /**
     * Insert one document (auto-generates _id and timestamps)
     */
    insertOne(collection, doc) {
        const data = this.findAll(collection);
        const now = new Date().toISOString();
        const newDoc = {
            _id: uuidv4(),
            ...doc,
            createdAt: doc.createdAt || now,
            updatedAt: now,
        };
        data.push(newDoc);
        this._persist(collection, data);
        return newDoc;
    },

    /**
     * Insert many documents
     */
    insertMany(collection, docs) {
        const data = this.findAll(collection);
        const now = new Date().toISOString();
        const newDocs = docs.map(doc => ({
            _id: uuidv4(),
            ...doc,
            createdAt: doc.createdAt || now,
            updatedAt: now,
        }));
        data.push(...newDocs);
        this._persist(collection, data);
        return newDocs;
    },

    /**
     * Update one document by id
     */
    updateById(collection, id, update) {
        const data = this.findAll(collection);
        const idx = data.findIndex(item => item._id === id);
        if (idx === -1) return null;
        data[idx] = {
            ...data[idx],
            ...update,
            _id: id, // preserve id
            updatedAt: new Date().toISOString(),
        };
        this._persist(collection, data);
        return data[idx];
    },

    /**
     * Update documents matching filter
     */
    updateMany(collection, filter, update) {
        const data = this.findAll(collection);
        let count = 0;
        data.forEach((item, idx) => {
            const matches = Object.entries(filter).every(([key, value]) => {
                if (key === '_id') {
                    // Handle $in arrays
                    if (value.$in) return value.$in.includes(item._id);
                    return item._id === value;
                }
                return item[key] === value;
            });
            if (matches) {
                if (update.$inc) {
                    Object.entries(update.$inc).forEach(([field, inc]) => {
                        data[idx][field] = (data[idx][field] || 0) + inc;
                    });
                } else {
                    Object.assign(data[idx], update);
                }
                data[idx].updatedAt = new Date().toISOString();
                count++;
            }
        });
        this._persist(collection, data);
        return count;
    },

    /**
     * Delete one document by id
     */
    deleteById(collection, id) {
        const data = this.findAll(collection);
        const idx = data.findIndex(item => item._id === id);
        if (idx === -1) return null;
        const removed = data.splice(idx, 1)[0];
        this._persist(collection, data);
        return removed;
    },

    /**
     * Delete all documents matching filter
     */
    deleteWhere(collection, filter = {}) {
        const data = this.findAll(collection);
        const remaining = data.filter(item => {
            return !Object.entries(filter).every(([key, value]) => item[key] === value);
        });
        const removed = data.length - remaining.length;
        this._persist(collection, remaining);
        return removed;
    },

    /**
     * Count documents
     */
    countDocuments(collection, filter = {}) {
        return this.findWhere(collection, filter).length;
    },

    /**
     * Persist data to file
     */
    _persist(collection, data) {
        fs.writeFileSync(DATA_FILES[collection], JSON.stringify(data, null, 2), 'utf-8');
    },

    /**
     * Initialize database with seed data
     */
    seed(collection, docs) {
        this._persist(collection, docs);
    },

    /**
     * Clear a collection
     */
    clear(collection) {
        this._persist(collection, []);
    }
};

module.exports = { DB, DATA_DIR };