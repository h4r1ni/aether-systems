// Script to update CTA links in index.html
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');

// Read the index.html file
fs.readFile(indexPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading index.html:', err);
    return;
  }

  // Replace the Foundation System CTA
  let updatedData = data.replace(
    /<a href="#" class="btn btn-primary" onclick="document\.getElementById\('essentials-modal'\)\.style\.display='block'; return false;">Design My System<\/a>/g,
    '<a href="foundation-onboarding.html" class="btn btn-primary">Design My System</a>'
  );

  // Replace the Operator Engine CTA
  updatedData = updatedData.replace(
    /<a href="#" class="btn btn-primary" onclick="document\.getElementById\('operator-modal'\)\.style\.display='block'; return false;">Design My System<\/a>/g,
    '<a href="operator-onboarding.html" class="btn btn-primary">Design My System</a>'
  );

  // Replace the Enterprise CTA
  updatedData = updatedData.replace(
    /<a href="#" id="enterprise-buy-button" class="btn btn-primary">Request a Quote<\/a>/g,
    '<a href="enterprise-onboarding.html" class="btn btn-primary">Request a Quote</a>'
  );

  // Write the updated file
  fs.writeFile(indexPath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to index.html:', err);
      return;
    }
    console.log('Successfully updated CTA links in index.html');
  });
});
