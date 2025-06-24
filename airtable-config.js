// Airtable integration configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'your_airtable_api_key';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'your_airtable_base_id';
const AIRTABLE_TABLE_NAME = '📄 Form Submissions';

module.exports = {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_NAME
};
