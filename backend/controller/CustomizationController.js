const CustomizationService = require('../model/CustomizationModel');

const CustomizationController = {
  // Get all customization services
  getAllServices: (req, res) => {
    CustomizationService.getAll((err, results) => {
      if (err) {
        console.error("Error fetching customization services:", err);
        return res.status(500).json({ error: 'Failed to fetch customization services' });
      }
      res.json(results);
    });
  },

  // Get customization service by ID
  getServiceById: (req, res) => {
    const { id } = req.params;
    CustomizationService.getById(id, (err, results) => {
      if (err) {
        console.error("Error fetching customization service:", err);
        return res.status(500).json({ error: 'Failed to fetch customization service' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Customization service not found' });
      }
      
      res.json(results[0]);
    });
  },

  // Create new customization service
  createService: (req, res) => {
    const serviceData = req.body;
    
    CustomizationService.create(serviceData, (err, result) => {
      if (err) {
        console.error("Error creating customization service:", err);
        return res.status(500).json({ error: 'Failed to create customization service' });
      }
      res.status(201).json({ message: 'Customization service created successfully', serviceId: result.insertId });
    });
  },

  // Update customization service
  updateService: (req, res) => {
    const { id } = req.params;
    const serviceData = req.body;
    
    CustomizationService.update(id, serviceData, (err, result) => {
      if (err) {
        console.error("Error updating customization service:", err);
        return res.status(500).json({ error: 'Failed to update customization service' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Customization service not found' });
      }
      
      res.json({ message: 'Customization service updated successfully' });
    });
  },

  // Delete customization service
  deleteService: (req, res) => {
    const { id } = req.params;
    
    CustomizationService.delete(id, (err, result) => {
      if (err) {
        console.error("Error deleting customization service:", err);
        return res.status(500).json({ error: 'Failed to delete customization service' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Customization service not found' });
      }
      
      res.json({ message: 'Customization service deleted successfully' });
    });
  },

  // Search customization services
  searchServices: (req, res) => {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    CustomizationService.search(term, (err, results) => {
      if (err) {
        console.error("Error searching customization services:", err);
        return res.status(500).json({ error: 'Failed to search customization services' });
      }
      res.json(results);
    });
  }
};

module.exports = CustomizationController;