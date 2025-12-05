const RentalInventory = require('../model/RentalInventoryModel');

// Create rental item
exports.createRental = (req, res) => {
  const { item_name, description, brand, size, color, category, base_rental_fee, daily_rate, deposit_amount, total_available, image_url, material, care_instructions } = req.body;

  // Handle image upload
  let imageUrl = null;
  if (req.file) {
    imageUrl = `/uploads/rental-images/${req.file.filename}`;
  }

  // Validation
  if (!item_name || !base_rental_fee || !daily_rate) {
    return res.status(400).json({ 
      message: "Item name, base rental fee, and daily rate are required" 
    });
  }

  const rentalData = {
    item_name,
    description,
    brand,
    size,
    color,
    category,
    base_rental_fee,
    daily_rate,
    deposit_amount,
    total_available,
    image_url: imageUrl, // Use the uploaded image path
    material,
    care_instructions
  };

  RentalInventory.create(rentalData, (err, result) => {
    if (err) {
      console.error("Error creating rental item:", err);
      return res.status(500).json({ 
        message: "Error creating rental item", 
        error: err 
      });
    }


    res.status(201).json({
      message: "Rental item created successfully",
      item_id: result.insertId,
      image_url: imageUrl, // Include image_url in response
      ...rentalData
    });
  });
};


exports.getAllRentals = (req, res) => {
  RentalInventory.getAll((err, results) => {
    if (err) {
      console.error("Error fetching rental items:", err);
      return res.status(500).json({ 
        message: "Error fetching rental items", 
        error: err 
      });
    }

    res.json({
      message: "Rental items retrieved successfully",
      items: results
    });
  });
};


exports.getRentalById = (req, res) => {
  const { item_id } = req.params;

  RentalInventory.findById(item_id, (err, results) => {
    if (err) {
      console.error("Error fetching rental item:", err);
      return res.status(500).json({ 
        message: "Error fetching rental item", 
        error: err 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        message: "Rental item not found" 
      });
    }

    res.json({
      message: "Rental item retrieved successfully",
      item: results[0]
    });
  });
};


exports.getAvailableRentals = (req, res) => {
  RentalInventory.getAvailableItems({}, (err, results) => {
    if (err) {
      console.error("Error fetching available rentals:", err);
      return res.status(500).json({ 
        message: "Error fetching available rentals", 
        error: err 
      });
    }

    res.json({
      message: "Available rentals retrieved successfully",
      items: results
    });
  });
};


exports.getRentalsByCategory = (req, res) => {
  const { category } = req.params;

  RentalInventory.getByCategory(category, (err, results) => {
    if (err) {
      console.error("Error fetching rentals by category:", err);
      return res.status(500).json({ 
        message: "Error fetching rentals by category", 
        error: err 
      });
    }

    res.json({
      message: `Rentals in ${category} category retrieved successfully`,
      items: results
    });
  });
};


exports.updateRental = (req, res) => {
  const { item_id } = req.params;
  const { item_name, description, brand, size, color, category, base_rental_fee, daily_rate, deposit_amount, total_available, image_url, material, care_instructions, status } = req.body;

  // Handle image upload
  let imageUrl = image_url; // Keep existing image_url if provided
  if (req.file) {
    imageUrl = `/uploads/rental-images/${req.file.filename}`;
  }

  RentalInventory.findById(item_id, (err, existingItem) => {
    if (err) {
      console.error("Error checking rental item:", err);
      return res.status(500).json({ 
        message: "Error checking rental item", 
        error: err 
      });
    }

    if (existingItem.length === 0) {
      return res.status(404).json({ 
        message: "Rental item not found" 
      });
    }

    // If no new image uploaded and no image_url provided, keep the existing one
    if (!imageUrl && existingItem[0].image_url) {
      imageUrl = existingItem[0].image_url;
    }

    const updateData = {
      item_name,
      description,
      brand,
      size,
      color,
      category,
      base_rental_fee,
      daily_rate,
      deposit_amount,
      total_available,
      image_url: imageUrl,
      material,
      care_instructions,
      status
    };

    RentalInventory.update(item_id, updateData, (err, result) => {
      if (err) {
        console.error("Error updating rental item:", err);
        return res.status(500).json({ 
          message: "Error updating rental item", 
          error: err 
        });
      }

      res.json({
        message: "Rental item updated successfully",
        item_id: parseInt(item_id),
        image_url: imageUrl,
        ...updateData
      });
    });
  });
};


exports.updateRentalStatus = (req, res) => {
  const { item_id } = req.params;
  const { status } = req.body;

  if (!['available', 'rented', 'maintenance'].includes(status)) {
    return res.status(400).json({ 
      message: "Invalid status. Must be: available, rented, or maintenance" 
    });
  }

  RentalInventory.updateStatus(item_id, status, (err, result) => {
    if (err) {
      console.error("Error updating rental status:", err);
      return res.status(500).json({ 
        message: "Error updating rental status", 
        error: err 
      });
    }

    res.json({
      message: `Rental item status updated to ${status}`,
      item_id: parseInt(item_id),
      status
    });
  });
};


exports.deleteRental = (req, res) => {
  const { item_id } = req.params;


  RentalInventory.findById(item_id, (err, existingItem) => {
    if (err) {
      console.error("Error checking rental item:", err);
      return res.status(500).json({ 
        message: "Error checking rental item", 
        error: err 
      });
    }

    if (existingItem.length === 0) {
      return res.status(404).json({ 
        message: "Rental item not found" 
      });
    }

    RentalInventory.delete(item_id, (err, result) => {
      if (err) {
        console.error("Error deleting rental item:", err);
        return res.status(500).json({ 
          message: "Error deleting rental item", 
          error: err 
        });
      }

      res.json({
        message: "Rental item deleted successfully",
        item_id: parseInt(item_id)
      });
    });
  });
};


exports.searchRentals = (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ 
      message: "Search query is required" 
    });
  }

  RentalInventory.search(q, (err, results) => {
    if (err) {
      console.error("Error searching rental items:", err);
      return res.status(500).json({ 
        message: "Error searching rental items", 
        error: err 
      });
    }

    res.json({
      message: `Search results for "${q}"`,
      items: results,
      search_term: q
    });
  });
};


exports.getCategories = (req, res) => {
  RentalInventory.getCategories((err, results) => {
    if (err) {
      console.error("Error fetching categories:", err);
      return res.status(500).json({ 
        message: "Error fetching categories", 
        error: err 
      });
    }

    res.json({
      message: "Categories retrieved successfully",
      categories: results.map(row => row.category)
    });
  });
};
