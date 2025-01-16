import pool from '../db';

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'admin';
    created_at: Date;
    updated_at: Date;
}

export class UserModel {
    static async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [user.name, user.email, user.password, user.role]
        );
        return result.rows[0];
    }

    static async findByEmail(email: string): Promise<User | null> {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    static async findOne(id: number): Promise<User | null> {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    static async update(id: number, data: Partial<Omit<User, 'id' | 'password' | 'role'>>): Promise<User | null> {
        const fields = Object.keys(data);
        const values = Object.values(data);
        
        if (fields.length === 0) return null;

        const setClause = fields
            .map((field, index) => `${field} = $${index + 1}`)
            .join(', ');

        const query = `
            UPDATE users 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $${fields.length + 1} 
            RETURNING *
        `;

        const result = await pool.query(query, [...values, id]);
        return result.rows[0] || null;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows.length > 0;
    }
}

export default UserModel;