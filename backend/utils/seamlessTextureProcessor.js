/**
 * Seamless Texture Processor
 * Converts uploaded images into high-quality seamless fabric patterns
 * suitable for 3D garment texturing (Three.js / WebGL)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Process an uploaded image into a seamless, tileable fabric pattern
 * @param {string} inputPath - Path to the original uploaded image
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processed texture info with paths
 */
async function createSeamlessTexture(inputPath, options = {}) {
  const {
    outputDir = 'uploads/patterns/processed',
    targetSize = 512, // Power of 2 for GPU optimization (256, 512, 1024, 2048)
    blendWidth = 0.15, // Blend width as percentage of image (15%)
    preserveColors = true,
    generateMipmaps = true,
    outputFormat = 'png'
  } = options;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = path.basename(inputPath, path.extname(inputPath));
  const timestamp = Date.now();

  try {
    // Read original image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`📐 Original image: ${metadata.width}x${metadata.height}`);

    // Step 1: Resize to power-of-2 dimensions for GPU optimization
    const resizedBuffer = await sharp(inputPath)
      .resize(targetSize, targetSize, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    // Step 2: Create seamless version using edge blending
    const seamlessBuffer = await makeSeamless(resizedBuffer, targetSize, blendWidth);

    // Step 3: Optimize for fabric texture rendering
    const optimizedBuffer = await optimizeForFabric(seamlessBuffer, {
      preserveColors,
      enhanceDetails: true
    });

    // Generate output paths
    const seamlessFilename = `${filename}-seamless-${timestamp}.${outputFormat}`;
    const seamlessPath = path.join(outputDir, seamlessFilename);

    // Save the seamless texture
    await sharp(optimizedBuffer)
      .png({ quality: 100, compressionLevel: 6 })
      .toFile(seamlessPath);

    console.log(`✅ Seamless texture created: ${seamlessPath}`);

    // Generate different sizes for mipmaps (optional)
    const mipmapPaths = {};
    if (generateMipmaps) {
      const sizes = [256, 128, 64];
      for (const size of sizes) {
        if (size < targetSize) {
          const mipmapFilename = `${filename}-seamless-${size}-${timestamp}.${outputFormat}`;
          const mipmapPath = path.join(outputDir, mipmapFilename);
          
          await sharp(optimizedBuffer)
            .resize(size, size)
            .png({ quality: 90 })
            .toFile(mipmapPath);
          
          mipmapPaths[size] = `/uploads/patterns/processed/${mipmapFilename}`;
        }
      }
    }

    return {
      success: true,
      originalPath: inputPath,
      seamlessPath: seamlessPath,
      seamlessUrl: `/uploads/patterns/processed/${seamlessFilename}`,
      size: targetSize,
      mipmaps: mipmapPaths,
      metadata: {
        width: targetSize,
        height: targetSize,
        format: outputFormat,
        isSeamless: true,
        isPowerOf2: true
      }
    };

  } catch (error) {
    console.error('❌ Error creating seamless texture:', error);
    return {
      success: false,
      error: error.message,
      originalPath: inputPath
    };
  }
}

/**
 * Make an image seamlessly tileable using cross-fade blending at edges
 * This creates smooth transitions when the texture repeats
 */
async function makeSeamless(imageBuffer, size, blendWidthPercent) {
  const blendWidth = Math.floor(size * blendWidthPercent);
  
  // Get raw pixel data
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const width = info.width;
  const height = info.height;

  // Create a copy for the output
  const output = Buffer.from(data);

  // Blend horizontal edges (left-right seam)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < blendWidth; x++) {
      const t = x / blendWidth; // Blend factor 0 to 1
      const leftIdx = (y * width + x) * channels;
      const rightIdx = (y * width + (width - blendWidth + x)) * channels;

      for (let c = 0; c < channels; c++) {
        // Cross-fade between left and right edges
        const leftVal = data[leftIdx + c];
        const rightVal = data[rightIdx + c];
        
        // Smooth blend using cosine interpolation
        const smoothT = (1 - Math.cos(t * Math.PI)) / 2;
        
        output[leftIdx + c] = Math.round(rightVal * (1 - smoothT) + leftVal * smoothT);
        output[rightIdx + c] = Math.round(leftVal * (1 - smoothT) + rightVal * smoothT);
      }
    }
  }

  // Blend vertical edges (top-bottom seam)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < blendWidth; y++) {
      const t = y / blendWidth;
      const topIdx = (y * width + x) * channels;
      const bottomIdx = ((height - blendWidth + y) * width + x) * channels;

      for (let c = 0; c < channels; c++) {
        const topVal = output[topIdx + c];
        const bottomVal = output[bottomIdx + c];
        
        const smoothT = (1 - Math.cos(t * Math.PI)) / 2;
        
        output[topIdx + c] = Math.round(bottomVal * (1 - smoothT) + topVal * smoothT);
        output[bottomIdx + c] = Math.round(topVal * (1 - smoothT) + bottomVal * smoothT);
      }
    }
  }

  // Convert back to image buffer
  return sharp(output, {
    raw: {
      width: width,
      height: height,
      channels: channels
    }
  }).png().toBuffer();
}

/**
 * Optimize the texture for fabric rendering
 * Enhances details and ensures proper color representation
 */
async function optimizeForFabric(imageBuffer, options = {}) {
  const { preserveColors = true, enhanceDetails = true } = options;

  let pipeline = sharp(imageBuffer);

  if (enhanceDetails) {
    // Slightly sharpen for fabric texture detail
    pipeline = pipeline.sharpen({
      sigma: 0.5,
      m1: 0.5,
      m2: 0.5
    });
  }

  if (preserveColors) {
    // Ensure sRGB color space for consistent web rendering
    pipeline = pipeline.toColorspace('srgb');
  }

  // Normalize levels slightly for better fabric appearance
  pipeline = pipeline.normalize();

  return pipeline.toBuffer();
}

/**
 * Generate texture repeat recommendations based on garment type
 */
function getRepeatRecommendation(garmentType, patternScale = 'medium') {
  const recommendations = {
    'coat': { repeatX: 3, repeatY: 4, scaleNote: 'Large garment, needs more repeats' },
    'coat-men': { repeatX: 3, repeatY: 4, scaleNote: 'Large garment, needs more repeats' },
    'coat-women': { repeatX: 3, repeatY: 4, scaleNote: 'Large garment, needs more repeats' },
    'blazer': { repeatX: 2.5, repeatY: 3.5, scaleNote: 'Medium-large garment' },
    'suit': { repeatX: 3, repeatY: 4, scaleNote: 'Full body coverage' },
    'suit-1': { repeatX: 3, repeatY: 4, scaleNote: 'Full body coverage' },
    'suit-2': { repeatX: 3, repeatY: 4, scaleNote: 'Full body coverage' },
    'barong': { repeatX: 2, repeatY: 3, scaleNote: 'Traditional shirt, moderate repeats' },
    'pants': { repeatX: 2, repeatY: 3, scaleNote: 'Lower body garment' },
    'shirt': { repeatX: 2, repeatY: 2.5, scaleNote: 'Standard shirt' },
    'default': { repeatX: 2, repeatY: 2, scaleNote: 'Default pattern repeat' }
  };

  const baseRepeat = recommendations[garmentType] || recommendations['default'];

  // Adjust based on pattern scale preference
  const scaleMultiplier = {
    'small': 1.5,  // More repeats for smaller pattern
    'medium': 1.0,
    'large': 0.6   // Fewer repeats for larger pattern
  }[patternScale] || 1.0;

  return {
    repeatX: baseRepeat.repeatX * scaleMultiplier,
    repeatY: baseRepeat.repeatY * scaleMultiplier,
    scaleNote: baseRepeat.scaleNote
  };
}

/**
 * Validate if an image is suitable for fabric texturing
 */
async function validateForFabricTexture(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    const issues = [];
    const recommendations = [];

    // Check minimum size
    if (metadata.width < 256 || metadata.height < 256) {
      issues.push('Image is too small. Minimum 256x256 recommended.');
    }

    // Check if square (best for seamless tiling)
    if (metadata.width !== metadata.height) {
      recommendations.push('Non-square image will be cropped to square for best tiling.');
    }

    // Check if power of 2 (GPU optimization)
    const isPowerOf2 = (n) => n && (n & (n - 1)) === 0;
    if (!isPowerOf2(metadata.width) || !isPowerOf2(metadata.height)) {
      recommendations.push('Image will be resized to power-of-2 dimensions for GPU optimization.');
    }

    // Check format
    if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
      issues.push(`Format ${metadata.format} may not be optimal. PNG or JPEG recommended.`);
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha
      }
    };

  } catch (error) {
    return {
      valid: false,
      issues: [`Cannot read image: ${error.message}`],
      recommendations: [],
      metadata: null
    };
  }
}

module.exports = {
  createSeamlessTexture,
  makeSeamless,
  optimizeForFabric,
  getRepeatRecommendation,
  validateForFabricTexture
};
