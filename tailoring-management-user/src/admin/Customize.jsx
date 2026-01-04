import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../adminStyle/customize.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getAllCustomizationOrders, updateCustomizationOrderItem, uploadGLBFile, getAllCustom3DModels, deleteCustom3DModel } from '../api/CustomizationApi';
import { getUserRole } from '../api/AuthApi';
import { getAllFabricTypesAdmin, createFabricType, updateFabricType, deleteFabricType } from '../api/FabricTypeApi';
import { getAllGarmentTypesAdmin, createGarmentType, updateGarmentType, deleteGarmentType } from '../api/GarmentTypeApi';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { getMeasurements, saveMeasurements } from '../api/CustomerApi';
import { useAlert } from '../context/AlertContext';
import { recordPayment } from '../api/PaymentApi';
import { deleteOrderItem } from '../api/OrderApi';

// Helper to check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};


const Customize = () => {
  const { alert, confirm } = useAlert();
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewFilter, setViewFilter] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    finalPrice: '',
    approvalStatus: '',
    adminNotes: ''
  });
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [measurements, setMeasurements] = useState({
    top: {},
    bottom: {},
    notes: ''
  });
  const [measurementsLoading, setMeasurementsLoading] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Price confirmation modal state
  const [showPriceConfirmationModal, setShowPriceConfirmationModal] = useState(false);
  const [priceConfirmationItem, setPriceConfirmationItem] = useState(null);
  const [priceConfirmationPrice, setPriceConfirmationPrice] = useState('');

  // Image preview modal state
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageAlt, setPreviewImageAlt] = useState('');

  // GLB upload modal state
  const [showGLBUploadModal, setShowGLBUploadModal] = useState(false);
  const [glbFile, setGlbFile] = useState(null);
  const [glbFormData, setGlbFormData] = useState({
    model_name: '',
    model_type: 'garment',
    garment_category: '',
    description: ''
  });
  const [uploadingGLB, setUploadingGLB] = useState(false);
  const [customModels, setCustomModels] = useState([]);

  // Fabric type management state
  const [showFabricTypeModal, setShowFabricTypeModal] = useState(false);
  const [fabricTypes, setFabricTypes] = useState([]);
  const [fabricTypeForm, setFabricTypeForm] = useState({
    fabric_name: '',
    fabric_price: '',
    description: '',
    is_active: 1
  });
  const [editingFabricType, setEditingFabricType] = useState(null);
  const [loadingFabricTypes, setLoadingFabricTypes] = useState(false);

  // Garment type management state
  const [showGarmentTypeModal, setShowGarmentTypeModal] = useState(false);
  const [garmentTypes, setGarmentTypes] = useState([]);
  const [garmentTypeForm, setGarmentTypeForm] = useState({
    garment_name: '',
    garment_price: '',
    garment_code: '',
    description: '',
    is_active: 1
  });
  const [editingGarmentType, setEditingGarmentType] = useState(null);
  const [loadingGarmentTypes, setLoadingGarmentTypes] = useState(false);
  const [garmentGlbFile, setGarmentGlbFile] = useState(null);
  const [uploadingGarmentGlb, setUploadingGarmentGlb] = useState(false);

  // Default garment categories (built-in)
  const defaultGarmentCategories = [
    { value: 'coat-men', label: 'Blazer' },
    { value: 'barong', label: 'Barong' },
    { value: 'suit-1', label: 'Suit' },
    { value: 'pants', label: 'Pants' }
  ];

  const openImagePreview = (url, alt) => {
    setPreviewImageUrl(url);
    setPreviewImageAlt(alt);
    setImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setImagePreviewOpen(false);
    setPreviewImageUrl('');
    setPreviewImageAlt('');
  };


  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };


  const openConfirmModal = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };


  const handleConfirm = () => {
    if (confirmAction) confirmAction();
    setShowConfirmModal(false);
    setConfirmAction(null);
  };


  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      setError('Please log in to access this page');
      navigate('/login');
      return;
    }
    const role = getUserRole();
    if (role !== 'admin') {
      setError('Admin access required');
      navigate('/');
      return;
    }
  }, [navigate]);


  // Helper function for status styling
  const getStatusClass = (status) => {
    const statusMap = {
      'pending_review': 'pending',
      'pending': 'pending',
      'accepted': 'accepted',
      'price_confirmation': 'price-confirmation',
      'confirmed': 'in-progress',
      'ready_for_pickup': 'to-pickup',
      'completed': 'completed',
      'cancelled': 'rejected',
      'auto_confirmed': 'in-progress'
    };
    return statusMap[status] || 'pending';
  };


  // Helper function for status display text
  const getStatusText = (status) => {
    const statusTextMap = {
      'pending_review': 'Pending',
      'pending': 'Pending',
      'accepted': 'Accepted',
      'price_confirmation': 'Price Confirmation',
      'confirmed': 'In Progress',
      'ready_for_pickup': 'To Pick up',
      'completed': 'Completed',
      'cancelled': 'Rejected',
      'auto_confirmed': 'In Progress'
    };
    return statusTextMap[status] || 'Pending';
  };

  // Get next status in workflow
  const getNextStatus = (currentStatus, serviceType = 'customization', item = null) => {
    if (!currentStatus || currentStatus === 'pending_review' || currentStatus === 'pending') {
      return 'price_confirmation';
    }
    
    // If status is 'price_confirmation', next is 'accepted' (after user confirms the price)
    if (currentStatus === 'price_confirmation') {
      return 'accepted';
    }
    
    // If status is 'accepted', next is 'confirmed' (in progress)
    if (currentStatus === 'accepted') {
      return 'confirmed';
    }
    
    const statusFlow = {
      'repair': ['pending', 'price_confirmation', 'accepted', 'confirmed', 'ready_for_pickup', 'completed'],
      'customization': ['pending', 'price_confirmation', 'accepted', 'confirmed', 'ready_for_pickup', 'completed'],
      'dry_cleaning': ['pending', 'price_confirmation', 'accepted', 'confirmed', 'ready_for_pickup', 'completed'],
      'rental': ['pending', 'ready_for_pickup', 'picked_up', 'rented', 'returned', 'completed']
    };
    
    const flow = statusFlow[serviceType] || statusFlow['customization'];
    const currentIndex = flow.indexOf(currentStatus);
    
    if (currentIndex === -1 || currentIndex === flow.length - 1) {
      return null; // Already at final status or unknown status
    }
    
    const nextStatus = flow[currentIndex + 1];
    
    // Check if trying to move to "completed" - require full payment
    if (nextStatus === 'completed' && item) {
      const pricingFactors = typeof item.pricing_factors === 'string' 
        ? JSON.parse(item.pricing_factors || '{}') 
        : (item.pricing_factors || {});
      const amountPaid = parseFloat(pricingFactors.amount_paid || 0);
      const finalPrice = parseFloat(item.final_price || 0);
      const remainingBalance = finalPrice - amountPaid;
      
      // If there's remaining balance, don't allow move to completed
      if (remainingBalance > 0.01) { // Use 0.01 to account for floating point precision
        return null;
      }
    }
    
    return nextStatus;
  };

  // Get next status label for display
  const getNextStatusLabel = (currentStatus, serviceType = 'customization', item = null) => {
    const nextStatus = getNextStatus(currentStatus, serviceType, item);
    if (!nextStatus) return null;
    
    const labelMap = {
      'accepted': 'Accept',
      'price_confirmation': 'Price Confirm',
      'confirmed': 'Start Progress',
      'ready_for_pickup': 'Ready for Pickup',
      'completed': 'Complete',
      'picked_up': 'Mark Picked Up',
      'rented': 'Mark Rented',
      'returned': 'Mark Returned'
    };
    
    return labelMap[nextStatus] || getStatusText(nextStatus);
  };


  // Load customization orders on component mount
  useEffect(() => {
    if (isAuthenticated() && getUserRole() === 'admin') {
      loadCustomizationOrders();
      loadCustom3DModels();
      loadFabricTypes();
      loadGarmentTypes();
    }
  }, []);

  // Load custom 3D models
  // Load fabric types
  const loadFabricTypes = async () => {
    setLoadingFabricTypes(true);
    try {
      const result = await getAllFabricTypesAdmin();
      if (result.success) {
        setFabricTypes(result.fabrics || []);
      } else {
        showToast(result.message || 'Failed to load fabric types', 'error');
      }
    } catch (err) {
      console.error("Load fabric types error:", err);
      showToast('Failed to load fabric types', 'error');
    } finally {
      setLoadingFabricTypes(false);
    }
  };

  // Handle fabric type form submit
  const handleFabricTypeSubmit = async () => {
    if (!fabricTypeForm.fabric_name.trim()) {
      showToast('Please enter a fabric name', 'error');
      return;
    }
    if (!fabricTypeForm.fabric_price || isNaN(parseFloat(fabricTypeForm.fabric_price))) {
      showToast('Please enter a valid price', 'error');
      return;
    }

    try {
      let result;
      if (editingFabricType) {
        result = await updateFabricType(editingFabricType.fabric_id, fabricTypeForm);
      } else {
        result = await createFabricType(fabricTypeForm);
      }
      
      if (result.success) {
        showToast(editingFabricType ? 'Fabric type updated successfully!' : 'Fabric type created successfully!', 'success');
        setShowFabricTypeModal(false);
        setFabricTypeForm({ fabric_name: '', fabric_price: '', description: '', is_active: 1 });
        setEditingFabricType(null);
        await loadFabricTypes();
      } else {
        showToast(result.message || 'Failed to save fabric type', 'error');
      }
    } catch (err) {
      console.error("Save fabric type error:", err);
      showToast('Failed to save fabric type', 'error');
    }
  };

  // Handle delete fabric type
  const handleDeleteFabricType = async (fabricId) => {
    openConfirmModal("Are you sure you want to delete this fabric type? This action cannot be undone.", async () => {
      try {
        const result = await deleteFabricType(fabricId);
        if (result.success) {
          showToast('Fabric type deleted successfully', 'success');
          // Immediately remove from list (optimistic update)
          setFabricTypes(prevFabrics => prevFabrics.filter(fabric => fabric.fabric_id !== fabricId));
          // Also reload from server to ensure consistency
          await loadFabricTypes();
        } else {
          showToast(result.message || 'Failed to delete fabric type', 'error');
        }
      } catch (err) {
        console.error("Delete fabric type error:", err);
        showToast('Failed to delete fabric type', 'error');
        // Reload on error to restore correct state
        await loadFabricTypes();
      }
    });
  };

  // Open fabric type modal for editing
  const openEditFabricType = (fabric) => {
    setEditingFabricType(fabric);
    setFabricTypeForm({
      fabric_name: fabric.fabric_name,
      fabric_price: fabric.fabric_price,
      description: fabric.description || '',
      is_active: fabric.is_active
    });
    setShowFabricTypeModal(true);
  };

  // Open fabric type modal for creating new
  const openNewFabricType = () => {
    setEditingFabricType(null);
    setFabricTypeForm({ fabric_name: '', fabric_price: '', description: '', is_active: 1 });
    setShowFabricTypeModal(true);
  };

  // Load garment types
  const loadGarmentTypes = async () => {
    setLoadingGarmentTypes(true);
    try {
      const result = await getAllGarmentTypesAdmin();
      if (result.success) {
        setGarmentTypes(result.garments || []);
      } else {
        showToast(result.message || 'Failed to load garment types', 'error');
      }
    } catch (err) {
      console.error("Load garment types error:", err);
      showToast('Failed to load garment types', 'error');
    } finally {
      setLoadingGarmentTypes(false);
    }
  };

  // Handle garment type form submit
  const handleGarmentTypeSubmit = async () => {
    if (!garmentTypeForm.garment_name.trim()) {
      showToast('Please enter a garment name', 'error');
      return;
    }
    if (!garmentTypeForm.garment_price || isNaN(parseFloat(garmentTypeForm.garment_price))) {
      showToast('Please enter a valid price', 'error');
      return;
    }
    if (!garmentTypeForm.garment_code.trim()) {
      showToast('Please enter a garment code', 'error');
      return;
    }
    // Require GLB file for new garment types (not required when editing)
    if (!editingGarmentType && !garmentGlbFile) {
      showToast('Please upload a 3D model (GLB file) for this garment type', 'error');
      return;
    }

    setUploadingGarmentGlb(true);

    try {
      let result;
      if (editingGarmentType) {
        result = await updateGarmentType(editingGarmentType.garment_id, garmentTypeForm);
      } else {
        result = await createGarmentType(garmentTypeForm);
      }
      
      if (result.success) {
        // If there's a GLB file, upload it as a custom 3D model
        if (garmentGlbFile) {
          const glbFormData = {
            model_name: garmentTypeForm.garment_name,
            model_type: 'garment',
            garment_category: garmentTypeForm.garment_code,
            description: garmentTypeForm.description || `3D model for ${garmentTypeForm.garment_name}`
          };
          
          const uploadResult = await uploadGLBFile(garmentGlbFile, glbFormData);
          if (!uploadResult.success) {
            showToast('Garment type saved but failed to upload 3D model: ' + (uploadResult.message || 'Unknown error'), 'warning');
          } else {
            await loadCustom3DModels();
          }
        }
        
        showToast(editingGarmentType ? 'Garment type updated successfully!' : 'Garment type created successfully!', 'success');
        setShowGarmentTypeModal(false);
        setGarmentTypeForm({ garment_name: '', garment_price: '', garment_code: '', description: '', is_active: 1 });
        setGarmentGlbFile(null);
        setEditingGarmentType(null);
        await loadGarmentTypes();
      } else {
        showToast(result.message || 'Failed to save garment type', 'error');
      }
    } catch (err) {
      console.error("Save garment type error:", err);
      showToast('Failed to save garment type', 'error');
    } finally {
      setUploadingGarmentGlb(false);
    }
  };

  // Handle GLB file change for garment type
  const handleGarmentGlbFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.glb')) {
        showToast('Please select a valid GLB file', 'error');
        return;
      }
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        showToast('File size must be less than 50MB', 'error');
        return;
      }
      setGarmentGlbFile(file);
    }
  };

  // Handle delete garment type
  const handleDeleteGarmentType = async (garmentId) => {
    openConfirmModal("Are you sure you want to delete this garment type? This action cannot be undone.", async () => {
      try {
        const result = await deleteGarmentType(garmentId);
        if (result.success) {
          showToast('Garment type deleted successfully', 'success');
          setGarmentTypes(prevGarments => prevGarments.filter(garment => garment.garment_id !== garmentId));
          await loadGarmentTypes();
        } else {
          showToast(result.message || 'Failed to delete garment type', 'error');
        }
      } catch (err) {
        console.error("Delete garment type error:", err);
        showToast('Failed to delete garment type', 'error');
        await loadGarmentTypes();
      }
    });
  };

  // Open garment type modal for editing
  const openEditGarmentType = (garment) => {
    setEditingGarmentType(garment);
    setGarmentTypeForm({
      garment_name: garment.garment_name,
      garment_price: garment.garment_price,
      garment_code: garment.garment_code || '',
      description: garment.description || '',
      is_active: garment.is_active
    });
    setGarmentGlbFile(null); // Reset GLB file when editing
    setShowGarmentTypeModal(true);
  };

  // Open garment type modal for creating new
  const openNewGarmentType = () => {
    setEditingGarmentType(null);
    setGarmentTypeForm({ garment_name: '', garment_price: '', garment_code: '', description: '', is_active: 1 });
    setGarmentGlbFile(null); // Reset GLB file
    setShowGarmentTypeModal(true);
  };

  // Get all garment categories (built-in + custom from API)
  const getAllGarmentCategories = () => {
    const categories = [...defaultGarmentCategories];
    
    // Add custom garment types from API
    garmentTypes.forEach(garment => {
      if (garment.is_active && garment.garment_code) {
        // Check if not already in defaults
        const exists = categories.find(c => c.value === garment.garment_code);
        if (!exists) {
          categories.push({
            value: garment.garment_code,
            label: garment.garment_name
          });
        }
      }
    });
    
    return categories;
  };

  const loadCustom3DModels = async () => {
    try {
      const result = await getAllCustom3DModels();
      if (result.success) {
        setCustomModels(result.models || []);
      }
    } catch (err) {
      console.error("Load custom 3D models error:", err);
    }
  };

  // Handle GLB file selection
  const handleGLBFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.glb')) {
        showToast('Please select a GLB file', 'error');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        showToast('File size must be less than 50MB', 'error');
        return;
      }
      setGlbFile(file);
    }
  };

  // Handle GLB upload
  const handleGLBUpload = async () => {
    if (!glbFile) {
      showToast('Please select a GLB file', 'error');
      return;
    }
    if (!glbFormData.model_name.trim()) {
      showToast('Please enter a model name', 'error');
      return;
    }
    // Require garment category for garment type models
    if (glbFormData.model_type === 'garment' && !glbFormData.garment_category) {
      showToast('Please select a garment type (Blazer, Barong, Suit, or Pants)', 'error');
      return;
    }

    // Check authentication before upload
    if (!isAuthenticated()) {
      showToast('Please log in to upload files', 'error');
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Authentication token not found. Please log in again.', 'error');
      navigate('/login');
      return;
    }

    setUploadingGLB(true);
    try {
      const result = await uploadGLBFile(glbFile, glbFormData);
      if (result.success) {
        showToast('GLB file uploaded successfully!', 'success');
        setShowGLBUploadModal(false);
        setGlbFile(null);
        setGlbFormData({
          model_name: '',
          model_type: 'garment',
          garment_category: '',
          description: ''
        });
        await loadCustom3DModels();
      } else {
        // Handle authentication errors
        if (result.requiresAuth) {
          showToast('Session expired. Please log in again.', 'error');
          // Optionally redirect to login
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          showToast(result.message || 'Failed to upload GLB file', 'error');
        }
      }
    } catch (err) {
      console.error("Upload GLB error:", err);
      showToast('Failed to upload GLB file', 'error');
    } finally {
      setUploadingGLB(false);
    }
  };

  // Handle delete custom model
  const handleDeleteModel = async (modelId) => {
    openConfirmModal("Are you sure you want to delete this 3D model? This action cannot be undone.", async () => {
      try {
        const result = await deleteCustom3DModel(modelId);
        if (result.success) {
          showToast('Model deleted successfully', 'success');
          await loadCustom3DModels();
        } else {
          showToast(result.message || 'Failed to delete model', 'error');
        }
      } catch (err) {
        console.error("Delete model error:", err);
        showToast('Failed to delete model', 'error');
      }
    });
  };

  // Handle delete all custom models
  const handleDeleteAllModels = async () => {
    if (customModels.length === 0) {
      showToast('No models to delete', 'info');
      return;
    }
    
    openConfirmModal(
      `Are you sure you want to delete ALL ${customModels.length} custom 3D models? This action cannot be undone.`,
      async () => {
        try {
          let deletedCount = 0;
          let failedCount = 0;
          
          for (const model of customModels) {
            try {
              const result = await deleteCustom3DModel(model.model_id);
              if (result.success) {
                deletedCount++;
              } else {
                failedCount++;
              }
            } catch (err) {
              console.error(`Error deleting model ${model.model_id}:`, err);
              failedCount++;
            }
          }
          
          if (deletedCount > 0) {
            showToast(`Successfully deleted ${deletedCount} model(s)`, 'success');
            await loadCustom3DModels();
          }
          if (failedCount > 0) {
            showToast(`Failed to delete ${failedCount} model(s)`, 'error');
          }
        } catch (err) {
          console.error("Delete all models error:", err);
          showToast('Error deleting models', 'error');
        }
      }
    );
  };


  const loadCustomizationOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllCustomizationOrders();
      if (result.success) {
        setAllItems(result.orders);
      } else {
        setError(result.message || 'Failed to load customization orders');
      }
    } catch (err) {
      console.error("Load error:", err);
      setError('Failed to load customization orders');
    } finally {
      setLoading(false);
    }
  };


  const pendingAppointments = allItems.filter(item =>
    item.approval_status === 'pending_review' ||
    item.approval_status === 'pending' ||
    item.approval_status === null ||
    item.approval_status === undefined ||
    item.approval_status === ''
  );


  const stats = {
    pending: pendingAppointments.length,
    accepted: allItems.filter(o => o.approval_status === 'accepted').length,
    inProgress: allItems.filter(o => o.approval_status === 'confirmed').length,
    toPickup: allItems.filter(o => o.approval_status === 'ready_for_pickup').length,
    completed: allItems.filter(o => o.approval_status === 'completed').length,
    rejected: allItems.filter(o => o.approval_status === 'cancelled').length
  };


  const getFilteredItems = () => {
    let items = [];


    if (viewFilter === "pending") {
      items = pendingAppointments;
    } else if (viewFilter === "accepted") {
      items = allItems.filter(item => item.approval_status === 'accepted');
    } else if (viewFilter === "price-confirmation") {
      items = allItems.filter(item => item.approval_status === 'price_confirmation');
    } else if (viewFilter === "in-progress") {
      items = allItems.filter(item => item.approval_status === 'confirmed');
    } else if (viewFilter === "to-pickup") {
      items = allItems.filter(item => item.approval_status === 'ready_for_pickup');
    } else if (viewFilter === "completed") {
      items = allItems.filter(item => item.approval_status === 'completed');
    } else if (viewFilter === "rejected") {
      items = allItems.filter(item => item.approval_status === 'cancelled');
    } else {
      items = allItems;
    }


    // Apply search filter
    items = items.filter(item =>
      !searchTerm ||
      item.order_id?.toString().includes(searchTerm.toLowerCase()) ||
      `${item.first_name} ${item.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.specific_data?.garmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.specific_data?.fabricType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    // Apply status filter only for "all" tab
    if (statusFilter && viewFilter === 'all') {
      items = items.filter(item => item.approval_status === statusFilter);
    }


    return items;
  };


  const handleAccept = (itemId) => {
    const item = allItems.find(i => i.item_id === itemId);
    if (!item) {
      showToast("Order not found", "error");
      return;
    }
    
    const estimatedPrice = getEstimatedPrice(item) || parseFloat(item.final_price || 0);
    setPriceConfirmationItem(item);
    setPriceConfirmationPrice(estimatedPrice.toFixed(2));
    setShowPriceConfirmationModal(true);
  };

  const handlePriceConfirmationSubmit = async () => {
    if (!priceConfirmationItem) return;
    
    const finalPrice = parseFloat(priceConfirmationPrice);
    if (isNaN(finalPrice) || finalPrice <= 0) {
      showToast("Please enter a valid price", "error");
      return;
    }

    try {
      const result = await updateCustomizationOrderItem(priceConfirmationItem.item_id, {
        approvalStatus: 'price_confirmation',
        finalPrice: finalPrice
      });
      if (result.success) {
        await loadCustomizationOrders();
        // Only switch to price-confirmation tab if user is not viewing "all"
        if (viewFilter !== 'all') {
          setViewFilter('price-confirmation');
        }
        showToast("Customization request moved to price confirmation!", "success");
        setShowPriceConfirmationModal(false);
        setPriceConfirmationItem(null);
        setPriceConfirmationPrice('');
      } else {
        showToast(result.message || "Failed to accept request", "error");
      }
    } catch (err) {
      console.error("Accept error:", err);
      showToast("Failed to accept request", "error");
    }
  };


  const handleDecline = (itemId) => {
    openConfirmModal("Are you sure you want to decline this customization request?", async () => {
      try {
        const result = await updateCustomizationOrderItem(itemId, {
          approvalStatus: 'cancelled'
        });
        if (result.success) {
          loadCustomizationOrders();
          showToast("Request declined", "success");
        } else {
          showToast(result.message || "Failed to decline request", "error");
        }
      } catch (err) {
        console.error("Decline error:", err);
        showToast("Failed to decline request", "error");
      }
    });
  };


  const updateStatus = async (itemId, status) => {
    const item = allItems.find(i => i.item_id === itemId);
    const statusLabel = getStatusText(status);
    const currentStatusLabel = item ? getStatusText(item.approval_status) : 'current';
    
    // Check if trying to move to "completed" - require full payment
    if (status === 'completed' && item) {
      const pricingFactors = typeof item.pricing_factors === 'string' 
        ? JSON.parse(item.pricing_factors || '{}') 
        : (item.pricing_factors || {});
      const amountPaid = parseFloat(pricingFactors.amount_paid || 0);
      const finalPrice = parseFloat(item.final_price || 0);
      const remainingBalance = finalPrice - amountPaid;
      
      // If there's remaining balance, prevent move to completed
      if (remainingBalance > 0.01) { // Use 0.01 to account for floating point precision
        showToast(`Cannot mark as completed. Payment is not complete. Remaining balance: ₱${remainingBalance.toFixed(2)}`, "error");
        return;
      }
    }
    
    openConfirmModal(
      `Are you sure you want to move this order from "${currentStatusLabel}" to "${statusLabel}"?`,
      async () => {
        try {
          const result = await updateCustomizationOrderItem(itemId, {
            approvalStatus: status
          });
          if (result.success) {
            await loadCustomizationOrders();

            // Only switch tab if user is not viewing "all" - preserve their current view
            if (viewFilter !== 'all') {
              // Automatically switch to the correct tab based on the new status
              if (status === 'accepted') {
                setViewFilter('accepted');
              } else if (status === 'price_confirmation') {
                setViewFilter('price-confirmation');
              } else if (status === 'confirmed') {
                setViewFilter('in-progress');
              } else if (status === 'ready_for_pickup') {
                setViewFilter('to-pickup');
              } else if (status === 'completed') {
                setViewFilter('completed');
              } else if (status === 'cancelled') {
                setViewFilter('rejected');
              }
            }

            showToast(`Status updated to "${statusLabel}"!`, "success");
          } else {
            showToast(result.message || "Failed to update status", "error");
          }
        } catch (err) {
          showToast("Failed to update status", "error");
        }
      }
    );
  };


  // Helper functions for 3D customization choices
  const getColorName = (hex) => {
    if (!hex) return 'Not specified';
    
    // Handle if it's already a string name
    if (typeof hex === 'string' && !hex.startsWith('#') && !hex.match(/^[0-9a-fA-F]{3,6}$/)) {
      return hex.charAt(0).toUpperCase() + hex.slice(1);
    }
    
    // Normalize hex
    let normalizedHex = String(hex).toLowerCase().trim();
    if (!normalizedHex.startsWith('#')) {
      normalizedHex = `#${normalizedHex}`;
    }
    
    // Color mappings
    const colorMap = {
      '#1a1a1a': 'Classic Black',
      '#1e3a5f': 'Navy Blue',
      '#6b1e3d': 'Burgundy',
      '#2d5a3d': 'Forest Green',
      '#4a4a4a': 'Charcoal Gray',
      '#c9a66b': 'Camel Tan',
      '#f5e6d3': 'Cream White',
      '#5d4037': 'Chocolate Brown',
      '#2a4d8f': 'Royal Blue',
      '#722f37': 'Wine Red',
      '#ffffff': 'White',
      '#000000': 'Black',
      '#ff0000': 'Red',
      '#00ff00': 'Green',
      '#0000ff': 'Blue',
      '#ffff00': 'Yellow',
      '#ff00ff': 'Magenta',
      '#00ffff': 'Cyan',
      '#808080': 'Gray',
      '#800000': 'Maroon',
      '#008000': 'Dark Green',
      '#000080': 'Navy',
      '#800080': 'Purple',
      '#ffa500': 'Orange',
      '#a52a2a': 'Brown',
      '#ffc0cb': 'Pink',
      '#ffd700': 'Gold',
      '#c0c0c0': 'Silver',
    };
    
    if (colorMap[normalizedHex]) {
      return colorMap[normalizedHex];
    }
    
    // Try to derive a name from RGB
    try {
      const r = parseInt(normalizedHex.slice(1, 3), 16);
      const g = parseInt(normalizedHex.slice(3, 5), 16);
      const b = parseInt(normalizedHex.slice(5, 7), 16);
      
      if (r > 200 && g > 200 && b > 200) return 'Light';
      if (r < 50 && g < 50 && b < 50) return 'Dark';
      if (r > g && r > b) return 'Reddish';
      if (g > r && g > b) return 'Greenish';
      if (b > r && b > g) return 'Bluish';
      if (r === g && g === b) return 'Gray';
    } catch (e) {
      // Fall through to return hex
    }
    
    return normalizedHex;
  };

  const getButtonType = (modelPath) => {
    if (!modelPath) return '';
    const buttonMap = {
      '/orange button 3d model.glb': 'Orange Button',
      '/four hole button 3d model (1).glb': 'Four Hole Button',
    };
    return buttonMap[modelPath] || modelPath.split('/').pop().replace('.glb', '').replace(/\d+/g, '').trim();
  };

  const getAccessoryName = (modelPath) => {
    if (!modelPath) return '';
    const accessoryMap = {
      '/accessories/gold lion pendant 3d model.glb': 'Pendant',
      '/accessories/flower brooch 3d model.glb': 'Brooch',
      '/accessories/fabric rose 3d model.glb': 'Flower',
    };
    return accessoryMap[modelPath] || modelPath.split('/').pop().replace('.glb', '').replace(/\d+/g, '').trim();
  };

  const handleViewDetails = (item) => {
    setSelectedOrder(item);
    setShowDetailModal(true);
  };


  const handleEditOrder = (item) => {
    setSelectedOrder(item);
    setEditForm({
      finalPrice: item.final_price || '',
      approvalStatus: item.approval_status || '',
      adminNotes: item.pricing_factors?.adminNotes || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteOrder = async (item) => {
    const confirmed = await confirm(
      `Are you sure you want to delete this completed order (ORD-${item.order_id})?\n\nThis action cannot be undone.`,
      'Delete Order',
      'danger',
      { confirmText: 'Delete', cancelText: 'Cancel' }
    );
    
    if (!confirmed) return;
    
    try {
      const result = await deleteOrderItem(item.item_id);
      if (result.success) {
        await alert('Order deleted successfully', 'Success', 'success');
        loadCustomizationOrders();
      } else {
        await alert(result.message || 'Failed to delete order', 'Error', 'error');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      await alert('Error deleting order', 'Error', 'error');
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedOrder || !paymentAmount) {
      await alert('Please enter a payment amount', 'Error', 'error');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      await alert('Please enter a valid payment amount', 'Error', 'error');
      return;
    }

    try {
      const result = await recordPayment(selectedOrder.item_id, amount);
      if (result.success) {
        const remaining = result.payment?.remaining_balance || 0;
        await alert(`Payment of ₱${amount.toFixed(2)} recorded successfully. ${remaining > 0 ? `Remaining balance: ₱${remaining.toFixed(2)}` : 'Payment complete!'}`, 'Success', 'success');
        setShowPaymentModal(false);
        setPaymentAmount('');
        await loadCustomizationOrders();
      } else {
        await alert(result.message || 'Failed to record payment', 'Error', 'error');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      await alert('Error recording payment', 'Error', 'error');
    }
  };

  // Helper to get estimated price for comparison
  const getEstimatedPrice = (item) => {
    if (!item || !item.specific_data) return null;
    // For customization, use the estimated price from specific_data or final_price as baseline
    return item.specific_data.estimatedPrice || parseFloat(item.final_price || 0);
  };


  const handleSaveEdit = async () => {
    if (!selectedOrder) return;


    try {
      const result = await updateCustomizationOrderItem(selectedOrder.item_id, editForm);


      if (result.success) {
        setShowEditModal(false);
        loadCustomizationOrders();
        showToast('Order updated successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to update order', 'error');
      }
    } catch (err) {
      console.error("Update error:", err);
      showToast('Failed to update order', 'error');
    }
  };


  return (
    <div className="customization-management">
      <Sidebar />
      <AdminHeader />


      <div className="content">
        <div className="dashboard-title">
          <div>
            <h2>Customization Management</h2>
            <p>Track and manage all customization orders</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={() => setShowGLBUploadModal(true)}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#667eea', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Add 3D Model
            </button>
            <button
              onClick={openNewFabricType}
              style={{
                marginLeft: '10px',
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Add Fabric Type
            </button>
            <button
              onClick={openNewGarmentType}
              style={{
                marginLeft: '10px',
                padding: '10px 20px',
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Add Garment Type
            </button>
          </div>
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}
        </div>


        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span>Pending</span>
              <div className="stat-icon" style={{ background: '#fff3e0', color: '#f57c00' }}>⏳</div>
            </div>
            <div className="stat-number">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span>In Progress</span>
              <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2196f3' }}>🔄</div>
            </div>
            <div className="stat-number">{stats.inProgress}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span>To Pick up</span>
              <div className="stat-icon" style={{ background: '#fff3e0', color: '#ff9800' }}>📦</div>
            </div>
            <div className="stat-number">{stats.toPickup}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span>Completed</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>✓</div>
            </div>
            <div className="stat-number">{stats.completed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span>Rejected</span>
              <div className="stat-icon" style={{ background: '#ffebee', color: '#f44336' }}>✕</div>
            </div>
            <div className="stat-number">{stats.rejected}</div>
          </div>
        </div>


        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Order ID, Name, Garment, or Fabric"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="price_confirmation">Price Confirmation</option>
            <option value="confirmed">In Progress</option>
            <option value="ready_for_pickup">To Pick up</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Rejected</option>
          </select>
        </div>


        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Garment</th>
                <th>Fabric</th>
                <th>Date</th>
                <th>Price</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Loading customization orders...</td></tr>
              ) : getFilteredItems().length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>No customization orders found</td></tr>
              ) : (
                getFilteredItems().map(item => {
                  // Get payment information
                  const pricingFactors = typeof item.pricing_factors === 'string' 
                    ? JSON.parse(item.pricing_factors || '{}') 
                    : (item.pricing_factors || {});
                  const amountPaid = parseFloat(pricingFactors.amount_paid || 0);
                  const finalPrice = parseFloat(item.final_price || 0);
                  const remainingBalance = finalPrice - amountPaid;

                  return (
                  <tr key={item.item_id} className="clickable-row" onClick={() => handleViewDetails(item)}>
                    <td><strong>#{item.order_id}</strong></td>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{item.specific_data?.garmentType || 'N/A'}</td>
                    <td><span style={{ fontSize: '0.9em', color: '#5D4037' }}>{item.specific_data?.fabricType || 'N/A'}</span></td>
                    <td>{new Date(item.order_date).toLocaleDateString()}</td>
                    <td>₱{parseFloat(item.final_price || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <div>Paid: ₱{amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div style={{ color: remainingBalance > 0 ? '#ff9800' : '#4caf50', fontWeight: 'bold' }}>
                          Remaining: ₱{Math.max(0, remainingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span className={`status-badge ${getStatusClass(item.approval_status || 'pending')}`}>
                        {getStatusText(item.approval_status || 'pending')}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {item.approval_status === 'pending_review' || item.approval_status === 'pending' || item.approval_status === null || item.approval_status === undefined || item.approval_status === '' ? (
                        <div className="action-buttons">
                          <button className="icon-btn accept" onClick={() => handleAccept(item.item_id)} title="Accept">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                          <button className="icon-btn decline" onClick={() => handleDecline(item.item_id)} title="Decline">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                          {item.approval_status !== 'completed' && item.approval_status !== 'cancelled' && (
                            <button 
                              className="icon-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(item);
                                setPaymentAmount('');
                                setShowPaymentModal(true);
                              }} 
                              title="Record Payment"
                              style={{ backgroundColor: '#2196F3', color: 'white' }}
                            >
                              💰
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="action-buttons">
                          {getNextStatus(item.approval_status, 'customization', item) && (
                            <button 
                              className="icon-btn next-status" 
                              onClick={() => updateStatus(item.item_id, getNextStatus(item.approval_status, 'customization', item))} 
                              title={`Move to ${getNextStatusLabel(item.approval_status, 'customization', item)}`}
                              style={{ backgroundColor: '#4CAF50', color: 'white' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </button>
                          )}
                          {item.approval_status !== 'completed' && item.approval_status !== 'cancelled' && (
                            <button 
                              className="icon-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(item);
                                setPaymentAmount('');
                                setShowPaymentModal(true);
                              }} 
                              title="Record Payment"
                              style={{ backgroundColor: '#2196F3', color: 'white' }}
                            >
                              💰
                            </button>
                          )}
                          {item.approval_status === 'completed' && (
                            <button 
                              className="icon-btn delete" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrder(item);
                              }} 
                              title="Delete Order"
                              style={{ backgroundColor: '#f44336', color: 'white' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Update Customization Order</h2>
              <span className="close-modal" onClick={() => setShowEditModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row"><strong>Order ID:</strong> #{selectedOrder.order_id}</div>
              <div className="detail-row"><strong>Garment:</strong> {selectedOrder.specific_data?.garmentType || 'N/A'}</div>
              <div className="detail-row"><strong>Fabric:</strong> {selectedOrder.specific_data?.fabricType || 'N/A'}</div>


              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Final Price (₱)</label>
                <input
                  type="number"
                  value={editForm.finalPrice}
                  onChange={(e) => {
                    const newPrice = e.target.value;
                    const estimatedPrice = getEstimatedPrice(selectedOrder);
                    const originalPrice = parseFloat(selectedOrder.final_price || 0);
                    
                    // If price is being changed and status is pending or accepted, auto-set to price_confirmation
                    let newStatus = editForm.approvalStatus;
                    if (newPrice && (editForm.approvalStatus === 'pending' || editForm.approvalStatus === 'accepted')) {
                      const priceChanged = estimatedPrice ? Math.abs(parseFloat(newPrice) - estimatedPrice) > 0.01 : 
                                          Math.abs(parseFloat(newPrice) - originalPrice) > 0.01;
                      if (priceChanged) {
                        newStatus = 'price_confirmation';
                      }
                    }
                    
                    setEditForm({...editForm, finalPrice: newPrice, approvalStatus: newStatus});
                  }}
                  placeholder="Enter final price"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                {(() => {
                  const estimatedPrice = getEstimatedPrice(selectedOrder);
                  if (estimatedPrice && editForm.finalPrice) {
                    const priceDiff = parseFloat(editForm.finalPrice) - estimatedPrice;
                    if (Math.abs(priceDiff) > 0.01) {
                      return (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.9em' }}>
                          <strong>⚠️ Price Changed:</strong> Estimated: ₱{estimatedPrice.toFixed(2)} → New: ₱{parseFloat(editForm.finalPrice).toFixed(2)}
                          <br />
                          <span style={{ color: '#666', fontSize: '0.85em' }}>Status will be set to "Price Confirmation" to notify customer.</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>


              <div className="form-group">
                <label>Status</label>
                <select
                  value={editForm.approvalStatus}
                  onChange={(e) => setEditForm({ ...editForm, approvalStatus: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="price_confirmation">Price Confirmation</option>
                  <option value="confirmed">In Progress</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Rejected</option>
                </select>
                {editForm.approvalStatus === 'price_confirmation' && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.9em', color: '#1976d2' }}>
                    ℹ️ Customer will be notified to confirm the updated price.
                  </div>
                )}
              </div>


              <div className="form-group">
                <label>Admin Notes</label>
                <textarea
                  value={editForm.adminNotes}
                  onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                  placeholder="Add admin notes..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              {/* Customer Measurements Section */}
              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Customer Measurements</h3>
                  <button 
                    className="btn-secondary" 
                    onClick={async () => {
                      setMeasurementsLoading(true);
                      const result = await getMeasurements(selectedOrder.user_id);
                      if (result.success && result.measurements) {
                        setMeasurements({
                          top: typeof result.measurements.top_measurements === 'string' 
                            ? JSON.parse(result.measurements.top_measurements) 
                            : result.measurements.top_measurements || {},
                          bottom: typeof result.measurements.bottom_measurements === 'string'
                            ? JSON.parse(result.measurements.bottom_measurements)
                            : result.measurements.bottom_measurements || {},
                          notes: result.measurements.notes || ''
                        });
                      } else {
                        setMeasurements({ top: {}, bottom: {}, notes: '' });
                      }
                      setMeasurementsLoading(false);
                      setShowMeasurementsModal(true);
                    }}
                    style={{ padding: '6px 12px', fontSize: '14px' }}
                  >
                    {measurementsLoading ? 'Loading...' : 'View/Edit Measurements'}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}


      {/* View Details Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order Details</h2>
              <span className="close-modal" onClick={() => setShowDetailModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row"><strong>Order ID:</strong> #{selectedOrder.order_id}</div>
              <div className="detail-row"><strong>Customer:</strong> {selectedOrder.first_name} {selectedOrder.last_name}</div>
              <div className="detail-row"><strong>Email:</strong> {selectedOrder.email}</div>
              <div className="detail-row"><strong>Garment:</strong> {selectedOrder.specific_data?.garmentType || 'N/A'}</div>
              <div className="detail-row"><strong>Fabric:</strong> {selectedOrder.specific_data?.fabricType || 'N/A'}</div>
              <div className="detail-row"><strong>Preferred Date:</strong> {selectedOrder.specific_data?.preferredDate || 'N/A'}</div>
              <div className="detail-row"><strong>Date Received:</strong> {new Date(selectedOrder.order_date).toLocaleDateString()}</div>
              <div className="detail-row"><strong>Price:</strong> ₱{parseFloat(selectedOrder.final_price || 0).toLocaleString()}</div>
              <div className="detail-row"><strong>Status:</strong>
                <span className={`status-badge ${getStatusClass(selectedOrder.approval_status || 'pending')}`}>
                  {getStatusText(selectedOrder.approval_status || 'pending')}
                </span>
              </div>

              {selectedOrder.specific_data?.notes && (
                <div className="detail-row"><strong>Customer Notes:</strong> {selectedOrder.specific_data.notes}</div>
              )}

              {selectedOrder.pricing_factors?.adminNotes && (
                <div className="detail-row"><strong>Admin Notes:</strong> {selectedOrder.pricing_factors.adminNotes}</div>
              )}

              {/* Customer Measurements Section */}
              <div className="measurements-btn-wrapper">
                  <button 
                    className="btn-measurements" 
                    onClick={async () => {
                      setMeasurementsLoading(true);
                      const result = await getMeasurements(selectedOrder.user_id);
                      if (result.success && result.measurements) {
                        setMeasurements({
                          top: typeof result.measurements.top_measurements === 'string' 
                            ? JSON.parse(result.measurements.top_measurements) 
                            : result.measurements.top_measurements || {},
                          bottom: typeof result.measurements.bottom_measurements === 'string'
                            ? JSON.parse(result.measurements.bottom_measurements)
                            : result.measurements.bottom_measurements || {},
                          notes: result.measurements.notes || ''
                        });
                      } else {
                        setMeasurements({ top: {}, bottom: {}, notes: '' });
                      }
                      setMeasurementsLoading(false);
                      setShowMeasurementsModal(true);
                    }}
                  >
                    {measurementsLoading ? 'Loading...' : 'View/Edit Measurements'}
                  </button>
              </div>

              {/* Show design preview images - all 4 angles if available */}
              {(() => {
                // Try to get angleImages - handle both parsed and string formats
                let designData = selectedOrder.specific_data?.designData;
                let angleImages = null;
                
                // If designData is a string, try to parse it
                if (typeof designData === 'string') {
                  try {
                    designData = JSON.parse(designData);
                  } catch (e) {
                    console.warn('Failed to parse designData:', e);
                    designData = null;
                  }
                }
                
                // Get angleImages from designData
                if (designData && designData.angleImages) {
                  angleImages = designData.angleImages;
                }
                
                // If angleImages exist, display all 4 views
                if (angleImages && (angleImages.front || angleImages.back || angleImages.right || angleImages.left)) {
                  return (
                    <div className="detail-row">
                      <strong>Design Views:</strong>
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          {['front', 'back', 'right', 'left'].map((angle) => (
                            angleImages[angle] && (
                              <div key={angle} style={{ position: 'relative' }}>
                                <div 
                                  className="clickable-image"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => openImagePreview(angleImages[angle], `${angle} view`)}
                                >
                                  <img
                                    src={angleImages[angle]}
                                    alt={`${angle} view`}
                                    style={{ 
                                      width: '100%', 
                                      height: 'auto', 
                                      maxHeight: '200px',
                                      borderRadius: '8px', 
                                      border: '2px solid #ddd',
                                      objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                  <div style={{ 
                                    position: 'absolute', 
                                    bottom: '5px', 
                                    left: '5px', 
                                    background: 'rgba(0,0,0,0.7)', 
                                    color: 'white', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    textTransform: 'capitalize',
                                    fontWeight: 'bold'
                                  }}>
                                    {angle}
                                  </div>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                        <small className="click-hint" style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '8px' }}>Click any image to expand</small>
                      </div>
                    </div>
                  );
                }
                
                // Fallback to single image if angleImages not available
                if (selectedOrder.specific_data?.imageUrl && selectedOrder.specific_data.imageUrl !== 'no-image') {
                  return (
                    <div className="detail-row">
                      <strong>Design Preview:</strong>
                      <div 
                        className="clickable-image"
                        style={{ marginTop: '10px', cursor: 'pointer' }}
                        onClick={() => openImagePreview(`http://localhost:5000${selectedOrder.specific_data.imageUrl}`, 'Design preview')}
                      >
                        <img
                          src={`http://localhost:5000${selectedOrder.specific_data.imageUrl}`}
                          alt="Design preview"
                          style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #ddd' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <small className="click-hint" style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '4px' }}>Click to expand</small>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })()}

              {/* Display 3D customization choices if available */}
              {(() => {
                // Try to get designData - handle both parsed and string formats
                let designData = selectedOrder.specific_data?.designData;
                
                // If designData is a string, try to parse it
                if (typeof designData === 'string') {
                  try {
                    designData = JSON.parse(designData);
                  } catch (e) {
                    console.warn('Failed to parse designData:', e);
                    designData = null;
                  }
                }
                
                // Display 3D customization choices if designData exists
                if (designData && (designData.size || designData.fit || designData.colors || designData.pattern || designData.personalization || designData.buttons || designData.accessories)) {
                  return (
                    <div className="detail-row" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <div style={{ width: '100%' }}>
                        <h5 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                          🎨 3D Customization Choices
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '14px' }}>
                          {designData.size && (
                            <div className="detail-row">
                              <strong>Size:</strong> {designData.size.charAt(0).toUpperCase() + designData.size.slice(1)}
                            </div>
                          )}
                          {designData.fit && (
                            <div className="detail-row">
                              <strong>Fit:</strong> {designData.fit.charAt(0).toUpperCase() + designData.fit.slice(1)}
                            </div>
                          )}
                          {designData.colors && designData.colors.fabric && (
                            <div className="detail-row">
                              <strong>Color:</strong> {getColorName(designData.colors.fabric)}
                            </div>
                          )}
                          {designData.pattern && designData.pattern !== 'none' && (
                            <div className="detail-row">
                              <strong>Pattern:</strong> {designData.pattern.charAt(0).toUpperCase() + designData.pattern.slice(1)}
                            </div>
                          )}
                          {designData.personalization && designData.personalization.initials && (
                            <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                              <strong>Personalization:</strong> {designData.personalization.initials}
                              {designData.personalization.font && ` (${designData.personalization.font} font)`}
                            </div>
                          )}
                          {designData.buttons && designData.buttons.length > 0 && (
                            <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                              <strong>Button Types:</strong>
                              <div style={{ marginLeft: '10px', marginTop: '5px', fontSize: '13px' }}>
                                {designData.buttons.map((btn, index) => (
                                  <div key={btn.id || index} style={{ margin: '5px 0' }}>
                                    Button {index + 1}: {getButtonType(btn.modelPath)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {designData.accessories && designData.accessories.length > 0 && (
                            <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                              <strong>Accessories:</strong>
                              <div style={{ marginLeft: '10px', marginTop: '5px', fontSize: '13px' }}>
                                {designData.accessories.map((acc, index) => (
                                  <div key={acc.id || index} style={{ margin: '5px 0' }}>
                                    {getAccessoryName(acc.modelPath)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
            <div className="modal-footer">
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}


      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay active confirm-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowConfirmModal(false)}>
          <div className="confirm-modal">
            <div className="confirm-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3>Confirm Action</h3>
            <p>{confirmMessage}</p>
            <div className="confirm-buttons">
              <button className="confirm-btn cancel" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="confirm-btn confirm" onClick={handleConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Price Confirmation Modal */}
      {showPriceConfirmationModal && priceConfirmationItem && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowPriceConfirmationModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Price Confirmation</h2>
              <span className="close-modal" onClick={() => setShowPriceConfirmationModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row"><strong>Order ID:</strong> #{priceConfirmationItem.order_id}</div>
              <div className="detail-row"><strong>Service:</strong> Customization</div>
              <div className="detail-row"><strong>Fabric:</strong> {priceConfirmationItem.specific_data?.fabricType || 'N/A'}</div>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Final Price (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceConfirmationPrice}
                  onChange={(e) => setPriceConfirmationPrice(e.target.value)}
                  placeholder="Enter final price"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                />
                {(() => {
                  const estimatedPrice = getEstimatedPrice(priceConfirmationItem);
                  if (estimatedPrice && priceConfirmationPrice) {
                    const priceDiff = parseFloat(priceConfirmationPrice) - estimatedPrice;
                    if (Math.abs(priceDiff) > 0.01) {
                      return (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.9em' }}>
                          <strong>⚠️ Price Changed:</strong> Estimated: ₱{estimatedPrice.toFixed(2)} → New: ₱{parseFloat(priceConfirmationPrice).toFixed(2)}
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
              
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.9em', color: '#1976d2' }}>
                ℹ️ Customer will be notified to confirm the price before proceeding.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowPriceConfirmationModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handlePriceConfirmationSubmit}>Confirm & Move to Price Confirmation</button>
            </div>
          </div>
        </div>
      )}


      {/* Measurements Modal */}
      {showMeasurementsModal && selectedOrder && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowMeasurementsModal(false)}>
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Customer Measurements</h2>
              <span className="close-modal" onClick={() => setShowMeasurementsModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row"><strong>Customer:</strong> {selectedOrder.first_name} {selectedOrder.last_name}</div>
              
              {/* Measurements Container - Top and Bottom side by side */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                {/* Top Measurements */}
                <div style={{ flex: 1, padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <p className="measurement-title" style={{ marginTop: 0, marginBottom: '15px', color: '#000', textAlign: 'center', fontWeight: '600', fontSize: '16px', padding: 0 }}>Top Measurements</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Chest (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.top.chest || ''}
                      onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, chest: e.target.value } })}
                      placeholder="Enter chest measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Shoulders (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.top.shoulders || ''}
                      onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, shoulders: e.target.value } })}
                      placeholder="Enter shoulder measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sleeve Length (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.top.sleeve_length || ''}
                      onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, sleeve_length: e.target.value } })}
                      placeholder="Enter sleeve length"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Neck (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.top.neck || ''}
                      onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, neck: e.target.value } })}
                      placeholder="Enter neck measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Waist (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.top.waist || ''}
                      onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, waist: e.target.value } })}
                      placeholder="Enter waist measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Length (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.top.length || ''}
                      onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, length: e.target.value } })}
                      placeholder="Enter length measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  </div>
                </div>

                {/* Bottom Measurements */}
                <div style={{ flex: 1, padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <p className="measurement-title" style={{ marginTop: 0, marginBottom: '15px', color: '#000', textAlign: 'center', fontWeight: '600', fontSize: '16px', padding: 0 }}>Bottom Measurements</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Waist (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.bottom.waist || ''}
                      onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, waist: e.target.value } })}
                      placeholder="Enter waist measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hips (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.bottom.hips || ''}
                      onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, hips: e.target.value } })}
                      placeholder="Enter hip measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Inseam (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.bottom.inseam || ''}
                      onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, inseam: e.target.value } })}
                      placeholder="Enter inseam measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Length (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.bottom.length || ''}
                      onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, length: e.target.value } })}
                      placeholder="Enter length measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Thigh (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.bottom.thigh || ''}
                      onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, thigh: e.target.value } })}
                      placeholder="Enter thigh measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Outseam (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.bottom.outseam || ''}
                      onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, outseam: e.target.value } })}
                      placeholder="Enter outseam measurement"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  </div>
                </div>
              </div>

              {/* Notes - Below both measurement sections */}
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '1px solid #ffcc80' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#000', fontWeight: '600', fontSize: '16px' }}>Notes</label>
                <textarea
                  value={measurements.notes}
                  onChange={(e) => setMeasurements({ ...measurements, notes: e.target.value })}
                  placeholder="Add any additional notes about measurements..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowMeasurementsModal(false)}>Cancel</button>
              <button className="btn-save" onClick={async () => {
                const result = await saveMeasurements(selectedOrder.user_id, measurements);
                if (result.success) {
                  await alert('Measurements saved successfully!', 'Success', 'success');
                  setShowMeasurementsModal(false);
                } else {
                  await alert(result.message || 'Failed to save measurements', 'Error', 'error');
                }
              }}>Save Measurements</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewOpen}
        imageUrl={previewImageUrl}
        altText={previewImageAlt}
        onClose={closeImagePreview}
      />

     {/* GLB Upload Modal */}
{showGLBUploadModal && (
  <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowGLBUploadModal(false)}>
    <div className="modal-content" style={{ maxWidth: '600px' }}>
      <div className="modal-header">
        <h2>Upload 3D Model (GLB File)</h2>
        <span className="close-modal" onClick={() => setShowGLBUploadModal(false)}>×</span>
      </div>
      
      <div className="glb-modal-body">
        {/* Model Type Selection - Prominent at the top */}
        <div className="model-type-selection">
          <label>
            Select Model Type * <span className="required-note">(Important: Choose where this model will be used)</span>
          </label>
          <select
            value={glbFormData.model_type}
            onChange={(e) => setGlbFormData({ ...glbFormData, model_type: e.target.value, garment_category: '' })}
          >
            <option value="garment">👔 Garment (Main clothing items - Coats, Suits, Barong, Pants)</option>
            <option value="button">🔘 Button (Decorative buttons for garments)</option>
            <option value="accessory">🎩 Accessory (Hats, ties, belts, etc.)</option>
          </select>
          <div className="model-type-info">
            {glbFormData.model_type === 'garment' && (
              <div>
                <strong>Garment:</strong> This will appear in the "Select Type" dropdown alongside built-in models (Blazer, Barong, Suit, Pants). 
                Use this for complete clothing items.
              </div>
            )}
            {glbFormData.model_type === 'button' && (
              <div>
                <strong>Button:</strong> This will appear in the "3D Buttons" section. Use this for decorative button models that can be added to garments.
              </div>
            )}
            {glbFormData.model_type === 'accessory' && (
              <div>
                <strong>Accessory:</strong> This will appear in the "3D Accessories" section. Use this for items like hats, ties, belts, etc.
              </div>
            )}
          </div>
        </div>

        <div className="glb-form-group">
          <label>Model Name *</label>
          <input
            type="text"
            value={glbFormData.model_name}
            onChange={(e) => setGlbFormData({ ...glbFormData, model_name: e.target.value })}
            placeholder={glbFormData.model_type === 'garment' ? 'e.g., Chinese Collar 3D Model' : glbFormData.model_type === 'button' ? 'e.g., Gold Button Set' : 'e.g., Leather Belt'}
          />
        </div>

        {/* Garment Category - Only show for garments */}
        {glbFormData.model_type === 'garment' && (
          <div className="glb-form-group">
            <label>Select Garment Type *</label>
            <select
              value={glbFormData.garment_category}
              onChange={(e) => setGlbFormData({ ...glbFormData, garment_category: e.target.value })}
              required
            >
              <option value="">-- Select Garment Type --</option>
              {getAllGarmentCategories().map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <small>This model will appear in the "Select Type" dropdown for the selected garment type</small>
          </div>
        )}

        <div className="glb-form-group">
          <label>GLB File *</label>
          <input
            type="file"
            accept=".glb"
            onChange={handleGLBFileChange}
          />
          {glbFile && (
            <div className="file-selected-info">
              Selected: {glbFile.name} ({(glbFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
          <small>Maximum file size: 50MB</small>
        </div>

        <div className="glb-form-group">
          <label>Description</label>
          <textarea
            value={glbFormData.description}
            onChange={(e) => setGlbFormData({ ...glbFormData, description: e.target.value })}
            placeholder="Optional description..."
            rows={3}
          />
        </div>

        {/* List of existing custom models */}
        {customModels.length > 0 && (
          <div className="models-list-header">
            <div className="models-list-title-row">
              <h3>Existing Custom Models ({customModels.length})</h3>
              <button
                onClick={handleDeleteAllModels}
                className="model-delete-all-btn"
                title="Delete all custom models"
              >
                DELETE ALL
              </button>
            </div>
            <div className="models-scrollable">
              {customModels.map(model => (
                <div key={model.model_id} className="model-item-card">
                  <div className="model-item-info">
                    <div className="model-item-name">{model.model_name}</div>
                    <div className="model-item-details">
                      Type: {model.model_type} | Category: {model.garment_category || 'N/A'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteModel(model.model_id)}
                    className="model-delete-btn"
                  >
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="modal-footer-centered">
        <button className="glb-btn-cancel" onClick={() => setShowGLBUploadModal(false)}>Cancel</button>
        <button 
          className="glb-btn-submit" 
          onClick={handleGLBUpload}
          disabled={uploadingGLB || !glbFile || !glbFormData.model_name.trim()}
        >
          {uploadingGLB ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  </div>
)}
       {/* Fabric Type Management Modal */}
{showFabricTypeModal && (
  <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowFabricTypeModal(false)}>
    <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="modal-header">
        <h2>{editingFabricType ? 'Edit Fabric Type' : 'Add Fabric Type'}</h2>
        <span className="close-modal" onClick={() => {
          setShowFabricTypeModal(false);
          setEditingFabricType(null);
          setFabricTypeForm({ fabric_name: '', fabric_price: '', description: '', is_active: 1 });
        }}>×</span>
      </div>
      
      <div className="customize-modal-body">
        <div className="customize-form-group">
          <label>Fabric Name *</label>
          <input
            type="text"
            value={fabricTypeForm.fabric_name}
            onChange={(e) => setFabricTypeForm({ ...fabricTypeForm, fabric_name: e.target.value })}
            placeholder="e.g., Silk, Cotton, Linen"
          />
        </div>

        <div className="customize-form-group">
          <label>Price (₱) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={fabricTypeForm.fabric_price}
            onChange={(e) => setFabricTypeForm({ ...fabricTypeForm, fabric_price: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="customize-form-group">
          <label>Description</label>
          <textarea
            value={fabricTypeForm.description}
            onChange={(e) => setFabricTypeForm({ ...fabricTypeForm, description: e.target.value })}
            placeholder="Optional description..."
            rows={3}
          />
        </div>

        <div className="customize-form-group">
          <label>
            <input
              type="checkbox"
              checked={fabricTypeForm.is_active === 1}
              onChange={(e) => setFabricTypeForm({ ...fabricTypeForm, is_active: e.target.checked ? 1 : 0 })}
            />
            Active (Show in dropdowns)
          </label>
        </div>

        {/* List of existing fabric types */}
        {fabricTypes.length > 0 && (
          <div className="fabric-types-list-header">
            <h3>Existing Fabric Types ({fabricTypes.length})</h3>
            <div className="fabric-types-scrollable">
              {fabricTypes.map(fabric => (
                <div 
                  key={fabric.fabric_id} 
                  className={`fabric-item-card ${fabric.is_active ? 'active' : 'inactive'}`}
                >
                  <div className="fabric-item-info">
                    <div className="fabric-item-name">{fabric.fabric_name}</div>
                    <div className="fabric-item-details">
                      <span className="price">Price: ₱{parseFloat(fabric.fabric_price).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      {fabric.description && ` | ${fabric.description}`}
                      {!fabric.is_active && <span className="inactive-badge">(Inactive)</span>}
                    </div>
                  </div>
                  <div className="fabric-item-actions">
                    <button
                      onClick={() => openEditFabricType(fabric)}
                      className="fabric-edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFabricType(fabric.fabric_id)}
                      className="fabric-delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="customize-modal-footer">
        <button className="customize-btn-cancel" onClick={() => {
          setShowFabricTypeModal(false);
          setEditingFabricType(null);
          setFabricTypeForm({ fabric_name: '', fabric_price: '', description: '', is_active: 1 });
        }}>Cancel</button>
        <button
          className="customize-btn-submit"
          onClick={handleFabricTypeSubmit}
          disabled={!fabricTypeForm.fabric_name.trim() || !fabricTypeForm.fabric_price || isNaN(parseFloat(fabricTypeForm.fabric_price))}
        >
          {editingFabricType ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Garment Type Management Modal */}
{showGarmentTypeModal && (
  <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowGarmentTypeModal(false)}>
    <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="modal-header">
        <h2>{editingGarmentType ? 'Edit Garment Type' : 'Add Garment Type'}</h2>
        <span className="close-modal" onClick={() => {
          setShowGarmentTypeModal(false);
          setEditingGarmentType(null);
          setGarmentTypeForm({ garment_name: '', garment_price: '', garment_code: '', description: '', is_active: 1 });
          setGarmentGlbFile(null);
        }}>×</span>
      </div>
      
      <div className="customize-modal-body">
        <div className="customize-form-group">
          <label>Garment Name *</label>
          <input
            type="text"
            value={garmentTypeForm.garment_name}
            onChange={(e) => setGarmentTypeForm({ ...garmentTypeForm, garment_name: e.target.value })}
            placeholder="e.g., Polo, Vest, Tuxedo"
          />
        </div>

        <div className="customize-form-group">
          <label>Garment Code *</label>
          <input
            type="text"
            value={garmentTypeForm.garment_code}
            onChange={(e) => setGarmentTypeForm({ ...garmentTypeForm, garment_code: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g., polo, vest, tuxedo (lowercase, no spaces)"
          />
          <small>This code is used internally to identify the garment type. Use lowercase letters and hyphens only.</small>
        </div>

        <div className="customize-form-group">
          <label>Price (₱) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={garmentTypeForm.garment_price}
            onChange={(e) => setGarmentTypeForm({ ...garmentTypeForm, garment_price: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="customize-form-group">
          <label>3D Model (GLB File) {!editingGarmentType && '*'}</label>
          <input
            type="file"
            accept=".glb"
            onChange={handleGarmentGlbFileChange}
            style={{ marginBottom: '8px' }}
          />
          {garmentGlbFile && (
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '4px',
              fontSize: '13px',
              color: '#2e7d32',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span>
              <span>Selected: {garmentGlbFile.name} ({(garmentGlbFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
          <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
            {editingGarmentType 
              ? 'Upload a new GLB file to replace the existing 3D model (optional)' 
              : 'Upload a 3D model file (.glb) that will be displayed in the 3D customizer. Max 50MB.'}
          </small>
        </div>

        <div className="customize-form-group">
          <label>Description</label>
          <textarea
            value={garmentTypeForm.description}
            onChange={(e) => setGarmentTypeForm({ ...garmentTypeForm, description: e.target.value })}
            placeholder="Optional description..."
            rows={3}
          />
        </div>

        <div className="customize-form-group">
          <label>
            <input
              type="checkbox"
              checked={garmentTypeForm.is_active === 1}
              onChange={(e) => setGarmentTypeForm({ ...garmentTypeForm, is_active: e.target.checked ? 1 : 0 })}
            />
            Active (Show in dropdowns)
          </label>
        </div>

        {/* List of existing garment types */}
        {garmentTypes.length > 0 && (
          <div className="fabric-types-list-header">
            <h3>Existing Garment Types ({garmentTypes.length})</h3>
            <div className="fabric-types-scrollable">
              {garmentTypes.map(garment => (
                <div 
                  key={garment.garment_id} 
                  className={`fabric-item-card ${garment.is_active ? 'active' : 'inactive'}`}
                >
                  <div className="fabric-item-info">
                    <div className="fabric-item-name">{garment.garment_name}</div>
                    <div className="fabric-item-details">
                      <span className="price">Price: ₱{parseFloat(garment.garment_price).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      {garment.garment_code && <span> | Code: {garment.garment_code}</span>}
                      {garment.description && ` | ${garment.description}`}
                      {!garment.is_active && <span className="inactive-badge">(Inactive)</span>}
                    </div>
                  </div>
                  <div className="fabric-item-actions">
                    <button
                      onClick={() => openEditGarmentType(garment)}
                      className="fabric-edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGarmentType(garment.garment_id)}
                      className="fabric-delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="customize-modal-footer">
        <button className="customize-btn-cancel" onClick={() => {
          setShowGarmentTypeModal(false);
          setEditingGarmentType(null);
          setGarmentTypeForm({ garment_name: '', garment_price: '', garment_code: '', description: '', is_active: 1 });
          setGarmentGlbFile(null);
        }} disabled={uploadingGarmentGlb}>Cancel</button>
        <button
          className="customize-btn-submit"
          onClick={handleGarmentTypeSubmit}
          disabled={
            uploadingGarmentGlb ||
            !garmentTypeForm.garment_name.trim() || 
            !garmentTypeForm.garment_price || 
            isNaN(parseFloat(garmentTypeForm.garment_price)) ||
            (!editingGarmentType && !garmentGlbFile) // GLB required for new garment types
          }
        >
          {uploadingGarmentGlb ? 'Uploading...' : (editingGarmentType ? 'Update' : 'Create')}
        </button>
      </div>
    </div>
  </div>
)}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedOrder && (
        <div className="modal-overlay active" onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) setShowPaymentModal(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <span className="close-modal" onClick={() => setShowPaymentModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Order ID:</strong>
                <span>ORD-{selectedOrder.order_id}</span>
              </div>
              <div className="detail-row">
                <strong>Customer:</strong>
                <span>{selectedOrder.first_name} {selectedOrder.last_name}</span>
              </div>
              <div className="detail-row">
                <strong>Service:</strong>
                <span>Customization - {selectedOrder.specific_data?.garmentType || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Total Price:</strong>
                <span>₱{parseFloat(selectedOrder.final_price || 0).toLocaleString()}</span>
              </div>
              {(() => {
                const pricingFactors = typeof selectedOrder.pricing_factors === 'string' 
                  ? JSON.parse(selectedOrder.pricing_factors || '{}') 
                  : (selectedOrder.pricing_factors || {});
                const amountPaid = parseFloat(pricingFactors.amount_paid || 0);
                const finalPrice = parseFloat(selectedOrder.final_price || 0);
                const remaining = finalPrice - amountPaid;
                
                if (amountPaid > 0) {
                  return (
                    <>
                      <div className="detail-row">
                        <strong>Amount Paid:</strong>
                        <span>₱{amountPaid.toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <strong>Remaining Balance:</strong>
                        <span style={{ color: remaining > 0 ? '#ff9800' : '#4caf50', fontWeight: 'bold' }}>
                          ₱{Math.max(0, remaining).toLocaleString()}
                        </span>
                      </div>
                    </>
                  );
                }
                return null;
              })()}
              
              <div className="payment-form-group">
                <label>Payment Amount *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="form-control"
                  placeholder="Enter payment amount"
                  min="0"
                  step="0.01"
                  autoFocus
                />
                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                  Enter the amount the customer is paying now
                </small>
              </div>
            </div>
            <div className="modal-footer-centered">
              <button className="btn-cancel" onClick={() => {
                setShowPaymentModal(false);
                setPaymentAmount('');
              }}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleRecordPayment}>
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Customize;
