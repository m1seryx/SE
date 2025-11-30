const RentalInventory = require('../model/RentalInventoryModel');

// Get available rental items for user browsing
exports.getAvailableRentals = (req, res) => {
  const { category, min_price, max_price, search, page = 1, limit = 20 } = req.query;
  
  // Convert pagination parameters
  const offset = (page - 1) * limit;
  
  const filters = {
    category,
    min_price,
    max_price,
    search,
    limit: parseInt(limit),
    offset
  };
  
  RentalInventory.getAvailableItems(filters, (err, items) => {
    if (err) {
      console.error("Error fetching available rental items:", err);
      return res.status(500).json({ 
        message: "Error fetching available rental items", 
        error: err 
      });
    }

    // Get total count for pagination
    RentalInventory.getAvailableItemsCount(filters, (err, countResult) => {
      if (err) {
        console.error("Error getting count:", err);
        return res.status(500).json({ 
          message: "Error getting item count", 
          error: err 
        });
      }

      const totalCount = countResult[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        message: "Available rental items retrieved successfully",
        items: items,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalCount,
          items_per_page: parseInt(limit)
        }
      });
    });
  });
};

// Get rental item details for user view
exports.getRentalDetails = (req, res) => {
  const { id } = req.params;
  
  RentalInventory.findById(id, (err, item) => {
    if (err) {
      console.error("Error fetching rental item:", err);
      return res.status(500).json({ 
        message: "Error fetching rental item", 
        error: err 
      });
    }

    if (item.length === 0) {
      return res.status(404).json({ 
        message: "Rental item not found" 
      });
    }

    const rentalItem = item[0];
    
    // Only show available items to users
    if (rentalItem.status !== 'available' || rentalItem.total_available <= 0) {
      return res.status(404).json({ 
        message: "Rental item is not available" 
      });
    }

    res.json({
      message: "Rental item details retrieved successfully",
      item: rentalItem
    });
  });
};

// Get rental categories for user filtering
exports.getCategories = (req, res) => {
  RentalInventory.getCategories((err, categories) => {
    if (err) {
      console.error("Error fetching categories:", err);
      return res.status(500).json({ 
        message: "Error fetching categories", 
        error: err 
      });
    }

    // Filter out null categories and count items in each
    const validCategories = categories
      .filter(cat => cat.category)
      .map(cat => cat.category);

    res.json({
      message: "Categories retrieved successfully",
      categories: validCategories
    });
  });
};

// Get rentals by category for user browsing
exports.getRentalsByCategory = (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const offset = (page - 1) * limit;
  
  RentalInventory.getByCategoryPaginated(category, limit, offset, (err, items) => {
    if (err) {
      console.error("Error fetching rentals by category:", err);
      return res.status(500).json({ 
        message: "Error fetching rentals by category", 
        error: err 
      });
    }

    // Get total count for this category
    RentalInventory.getCategoryCount(category, (err, countResult) => {
      if (err) {
        console.error("Error getting category count:", err);
        return res.status(500).json({ 
          message: "Error getting category count", 
          error: err 
        });
      }

      const totalCount = countResult[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        message: "Rentals by category retrieved successfully",
        category: category,
        items: items,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalCount,
          items_per_page: parseInt(limit)
        }
      });
    });
  });
};

// Search rental items for user
exports.searchRentals = (req, res) => {
  const { query, category, min_price, max_price, page = 1, limit = 20 } = req.query;
  
  const offset = (page - 1) * limit;
  
  const filters = {
    query,
    category,
    min_price,
    max_price,
    limit: parseInt(limit),
    offset
  };
  
  RentalInventory.searchItems(filters, (err, items) => {
    if (err) {
      console.error("Error searching rental items:", err);
      return res.status(500).json({ 
        message: "Error searching rental items", 
        error: err 
      });
    }

    // Get search count
    RentalInventory.getSearchCount(filters, (err, countResult) => {
      if (err) {
        console.error("Error getting search count:", err);
        return res.status(500).json({ 
          message: "Error getting search count", 
          error: err 
        });
      }

      const totalCount = countResult[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        message: "Rental items search completed",
        items: items,
        search_params: {
          query,
          category,
          min_price,
          max_price
        },
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalCount,
          items_per_page: parseInt(limit)
        }
      });
    });
  });
};

// Get featured/featured rentals for homepage
exports.getFeaturedRentals = (req, res) => {
  const { limit = 8 } = req.query;
  
  RentalInventory.getFeaturedItems(parseInt(limit), (err, items) => {
    if (err) {
      console.error("Error fetching featured rentals:", err);
      return res.status(500).json({ 
        message: "Error fetching featured rentals", 
        error: err 
      });
    }

    res.json({
      message: "Featured rentals retrieved successfully",
      items: items
    });
  });
};

// Get similar rentals (based on category)
exports.getSimilarRentals = (req, res) => {
  const { id } = req.params;
  const { limit = 6 } = req.query;
  
  // First get the item to find its category
  RentalInventory.findById(id, (err, item) => {
    if (err) {
      console.error("Error fetching rental item:", err);
      return res.status(500).json({ 
        message: "Error fetching rental item", 
        error: err 
      });
    }

    if (item.length === 0) {
      return res.status(404).json({ 
        message: "Rental item not found" 
      });
    }

    const category = item[0].category;
    
    // Get similar items from same category (excluding current item)
    RentalInventory.getSimilarItems(category, id, parseInt(limit), (err, similarItems) => {
      if (err) {
        console.error("Error fetching similar rentals:", err);
        return res.status(500).json({ 
          message: "Error fetching similar rentals", 
          error: err 
        });
      }

      res.json({
        message: "Similar rentals retrieved successfully",
        items: similarItems
      });
    });
  });
};
