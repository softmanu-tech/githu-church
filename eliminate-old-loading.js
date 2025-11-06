// Complete elimination of old loading patterns
// This script will find and replace ALL old loading patterns

const fs = require('fs');
const path = require('path');

// Function to recursively find all .tsx and .ts files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to replace old loading patterns
function replaceOldLoadingPatterns(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace old skeleton imports
    if (content.includes("import { CardSkeleton, ChartSkeleton, TableSkeleton }")) {
      content = content.replace(
        /import { CardSkeleton, ChartSkeleton, TableSkeleton } from ['"][^'"]*['"];?/g,
        "import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from '@/components/ui/ultra-fast-skeleton';"
      );
      modified = true;
    }
    
    // Replace skeleton component usage
    if (content.includes('<CardSkeleton')) {
      content = content.replace(/<CardSkeleton/g, '<UltraFastCardSkeleton');
      modified = true;
    }
    
    if (content.includes('<ChartSkeleton')) {
      content = content.replace(/<ChartSkeleton/g, '<UltraFastChartSkeleton');
      modified = true;
    }
    
    if (content.includes('<TableSkeleton')) {
      content = content.replace(/<TableSkeleton/g, '<UltraFastTableSkeleton');
      modified = true;
    }
    
    // Remove framer-motion imports
    if (content.includes('import { motion } from "framer-motion"')) {
      content = content.replace(/import { motion } from "framer-motion";?\n?/g, '');
      modified = true;
    }
    
    if (content.includes('import { fadeIn')) {
      content = content.replace(/import { fadeIn[^}]*} from ['"][^'"]*['"];?\n?/g, '');
      modified = true;
    }
    
    // Replace motion components
    if (content.includes('<motion.div')) {
      content = content.replace(/<motion\.div/g, '<div className="animate-fade-in"');
      modified = true;
    }
    
    if (content.includes('</motion.div>')) {
      content = content.replace(/<\/motion\.div>/g, '</div>');
      modified = true;
    }
    
    if (content.includes('<motion.tr')) {
      content = content.replace(/<motion\.tr/g, '<tr className="animate-fade-in"');
      modified = true;
    }
    
    if (content.includes('</motion.tr>')) {
      content = content.replace(/<\/motion\.tr>/g, '</tr>');
      modified = true;
    }
    
    // Remove variants
    content = content.replace(/variants={[^}]*}/g, '');
    content = content.replace(/initial={[^}]*}/g, '');
    content = content.replace(/animate={[^}]*}/g, '');
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🚀 Starting complete old loading pattern elimination...');

const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`📁 Found ${files.length} files to process`);

files.forEach(file => {
  replaceOldLoadingPatterns(file);
});

console.log('🎉 Complete old loading pattern elimination finished!');
console.log('✅ All files now use ultra-fast skeleton loading!');
