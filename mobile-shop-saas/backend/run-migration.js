const pool = require('./config/database');

async function runMigration() {
    try {
        console.log('Starting subscription table migration...');

        // Check if amount column exists
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'mobile_shop_saas' 
            AND TABLE_NAME = 'subscriptions'
        `);
        const columnNames = columns.map(c => c.COLUMN_NAME);

        // Add amount column if not exists
        if (!columnNames.includes('amount')) {
            console.log('Adding amount column...');
            await pool.query('ALTER TABLE subscriptions ADD COLUMN amount DECIMAL(10, 2) NULL AFTER end_date');
            console.log('✓ Amount column added');
        } else {
            console.log('✓ Amount column already exists');
        }

        // Add payment_method column if not exists
        if (!columnNames.includes('payment_method')) {
            console.log('Adding payment_method column...');
            await pool.query('ALTER TABLE subscriptions ADD COLUMN payment_method VARCHAR(50) NULL AFTER amount');
            console.log('✓ Payment method column added');
        } else {
            console.log('✓ Payment method column already exists');
        }

        // Check if plan_type needs update
        const [planTypeColumn] = await pool.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'mobile_shop_saas' 
            AND TABLE_NAME = 'subscriptions'
            AND COLUMN_NAME = 'plan_type'
        `);

        if (planTypeColumn.length > 0) {
            const columnType = planTypeColumn[0].COLUMN_TYPE;
            if (!columnType.includes('monthly') && !columnType.includes('quarterly') && !columnType.includes('yearly')) {
                console.log('Updating plan_type enum...');
                
                // Create backup
                await pool.query('CREATE TABLE IF NOT EXISTS subscriptions_backup AS SELECT * FROM subscriptions');
                
                // Drop old column
                await pool.query('ALTER TABLE subscriptions DROP COLUMN plan_type');
                
                // Add new column with updated enum values
                await pool.query("ALTER TABLE subscriptions ADD COLUMN plan_type ENUM('basic', 'standard', 'premium', 'monthly', 'quarterly', 'yearly', 'trial') DEFAULT 'basic' AFTER shop_id");
                
                // Restore data from backup
                await pool.query(`
                    UPDATE subscriptions s
                    JOIN subscriptions_backup sb ON s.id = sb.id
                    SET s.plan_type = sb.plan_type
                `);
                
                // Drop backup table
                await pool.query('DROP TABLE IF EXISTS subscriptions_backup');
                
                console.log('✓ Plan type enum updated');
            } else {
                console.log('✓ Plan type enum already updated');
            }
        }

        console.log('\nMigration completed successfully!');
        console.log('Current subscriptions table structure:');
        const [structure] = await pool.query('DESCRIBE subscriptions');
        console.table(structure);
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
