import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TARGET_FOLDER = './cards';
const BATCH_SIZE = 500;      
const START_BATCH = 3

function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`[ERROR] Failed executing: ${command}`);
    process.exit(1);
  }
}

async function main() {
  if (!fs.existsSync(TARGET_FOLDER)) {
    console.error(`[ERROR] Folder "${TARGET_FOLDER}" not found!`);
    return;
  }

  // Get all webp/jpg files from the folder
  const allFiles = fs.readdirSync(TARGET_FOLDER).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.webp' || ext === '.jpg' || ext === '.jpeg' || ext === '.png';
  });

  const totalFiles = allFiles.length;
  console.log(`[INFO] Found ${totalFiles} images inside "${TARGET_FOLDER}".`);

  if (totalFiles === 0) {
    console.log("[INFO] No images to push.");
    return;
  }

  const totalBatches = Math.ceil(totalFiles / BATCH_SIZE);
  console.log(`[INFO] Splitting into ${totalBatches} batches of ${BATCH_SIZE} files...\n`);

  for (let i = (START_BATCH - 1); i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    const currentBatchFiles = allFiles.slice(start, end);

    console.log(`=========================================`);
    console.log(`PROCESSING BATCH ${i + 1} OF ${totalBatches} (${currentBatchFiles.length} files)`);
    console.log(`=========================================`);

    // 1. Stage only the files belonging to this specific batch
    console.log(`[1/3] Staging files...`);
    const filePathsStaging = currentBatchFiles.map(file => `"${path.join(TARGET_FOLDER, file)}"`).join(' ');
    runCommand(`git add ${filePathsStaging}`);

    // 2. Create the commit for this specific batch
    console.log(`[2/3] Committing batch...`);
    runCommand(`git commit -m "Upload asset batch ${i + 1}/${totalBatches}"`);

    // 3. Push this specific batch up to GitHub
    console.log(`[3/3] Pushing to GitHub...`);
    runCommand(`git push origin main`);

    console.log(`[SUCCESS] Batch ${i + 1} fully pushed!\n`);
  }

  console.log("🎉 ALL IMAGES SUCCESSFULLY DEPLOYED TO GITHUB!");
}

main();