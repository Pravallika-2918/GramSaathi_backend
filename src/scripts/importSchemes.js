require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');
const connectDB = require('../config/db');

const CATEGORY_MAP = {
  'Agriculture': 'Agriculture',
  'Education': 'Education',
  'Health': 'Healthcare',
  'Healthcare': 'Healthcare',
  'Housing': 'Housing',
  'Employment': 'Employment',
  'Women': 'Women & Child',
  'Child': 'Women & Child',
  'Social': 'Social Welfare',
  'Financial': 'Financial',
  'Rural': 'Rural Development',
};

const mapCategory = (cat) => {
  if (!cat) return 'Other';
  const catLower = cat.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (catLower.includes(key.toLowerCase())) return value;
  }
  return 'Other';
};

const importSchemes = async () => {
  await connectDB();
  const csvPath = path.join(__dirname, '../../data/schemes.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    console.log('Please download the dataset from Kaggle and place schemes.csv in the data/ folder');
    process.exit(1);
  }

  const schemes = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      try {
        const scheme = {
          schemeName: row['Scheme Name'] || row['scheme_name'] || row['name'] || 'Unknown Scheme',
          category: mapCategory(row['Category'] || row['category'] || row['type'] || ''),
          description: row['Description'] || row['description'] || row['details'] || '',
          benefits: row['Benefits'] || row['benefits'] || row['benefit'] || '',
          ministry: row['Ministry'] || row['ministry'] || row['department'] || '',
          applicationLink: row['Link'] || row['link'] || row['url'] || row['application_link'] || '',
          applicationDeadline: row['Deadline'] || row['deadline'] || 'Ongoing',
          eligibility: {
            minAge: parseInt(row['Min Age'] || row['min_age'] || 0) || 0,
            maxAge: parseInt(row['Max Age'] || row['max_age'] || 150) || 150,
            gender: ['Male', 'Female', 'All'].includes(row['Gender'] || row['gender']) ? (row['Gender'] || row['gender']) : 'All',
            maxIncome: parseInt(row['Max Income'] || row['max_income'] || 99999999) || 99999999,
          },
          documentsRequired: row['Documents'] || row['documents']
            ? (row['Documents'] || row['documents']).split(',').map((d) => d.trim()).filter(Boolean)
            : ['Aadhaar Card', 'Income Certificate'],
          isActive: true,
        };

        if (scheme.schemeName && scheme.schemeName !== 'Unknown Scheme') {
          schemes.push(scheme);
        }
      } catch (err) {
        // Skip malformed rows
      }
    })
    .on('end', async () => {
      try {
        console.log(`📊 Found ${schemes.length} schemes in CSV`);

        if (schemes.length === 0) {
          console.warn('⚠️  No valid schemes found in CSV. Check column names.');
          process.exit(0);
        }

        // Upsert schemes
        let imported = 0;
        for (const scheme of schemes) {
          await Scheme.findOneAndUpdate(
            { schemeName: scheme.schemeName },
            scheme,
            { upsert: true, new: true }
          );
          imported++;
        }

        console.log(`✅ Successfully imported ${imported} schemes!`);
        process.exit(0);
      } catch (error) {
        console.error('❌ Import error:', error.message);
        process.exit(1);
      }
    })
    .on('error', (error) => {
      console.error('❌ CSV read error:', error.message);
      process.exit(1);
    });
};

importSchemes();