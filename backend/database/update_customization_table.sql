
ALTER TABLE customization_services 
ADD COLUMN clothing_type VARCHAR(50) NULL COMMENT 'Type of clothing (coat, barong, suit, etc.)' AFTER style_complexity,
ADD COLUMN variant_id VARCHAR(50) NULL COMMENT 'Specific variant of the clothing' AFTER clothing_type,
ADD COLUMN gender ENUM('male', 'female', 'unisex') NULL DEFAULT 'unisex' AFTER variant_id,
ADD COLUMN fabric_type VARCHAR(50) NULL COMMENT 'Fabric type selection' AFTER gender,
ADD COLUMN pattern_type VARCHAR(50) NULL COMMENT 'Pattern type (solid, stripes, etc.)' AFTER fabric_type,
ADD COLUMN color_value VARCHAR(7) NULL COMMENT 'Hex color value' AFTER pattern_type,
ADD COLUMN clothing_fit ENUM('regular', 'slim', 'loose') NULL DEFAULT 'regular' AFTER color_value,
ADD COLUMN ai_image_url TEXT NULL COMMENT 'URL of generated AI preview image' AFTER clothing_fit,
ADD COLUMN customization_prompt TEXT NULL COMMENT 'AI prompt used for image generation' AFTER ai_image_url;


ALTER TABLE customization_services 
ADD INDEX idx_clothing_type (clothing_type),
ADD INDEX idx_variant_id (variant_id),
ADD INDEX idx_fabric_type (fabric_type);