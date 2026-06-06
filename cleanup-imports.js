import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, 'src', 'routes', '_authenticated');

try {
  const files = fs.readdirSync(routesDir);
  let count = 0;

  for (const file of files) {
    if (file.endsWith('.ts')) {
      const filePath = path.join(routesDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      
      const targetStr = "import { createTableParamsSchema } from '@/schemas/table-params'";
      
      if (content.includes(targetStr)) {
        content = content.replace(targetStr, '');
        // Clean up any double empty lines that might have been created
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Cleaned up ${file}`);
        count++;
      }
    }
  }
  console.log(`\nSuccessfully cleaned ${count} files.`);
} catch (error) {
  console.error("Error during cleanup:", error);
}
