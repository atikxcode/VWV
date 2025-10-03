
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  Upload,
  AlertCircle,
  Save,
  Trash2,
  Eye,
  X,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Settings,
  Zap,
  Clock,
  MousePointer,
  Timer,
} from "lucide-react";

const MySwal = Swal;

export default function OfferPopupAdmin() {
  // Form state
  const [formData, setFormData] = useState({
    headline: "JOIN OUR",
    title: "NEWSLETTER",
    subtitle: "TO RECEIVE NEW EXCLUSIVE DEALS 50%",
    isActive: false,
    displayRules: {
      triggerType: "scroll",
      delaySeconds: 0,
      showOnce: true,
    },
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [popupExists, setPopupExists] = useState(false);
  const [popupId, setPopupId] = useState(null);
  
  const fileInputRef = useRef(null);

  // Get JWT token from localStorage
// Get JWT token from localStorage
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth-token") || sessionStorage.getItem("auth-token");  // Changed from "token" to "auth-token"
  }
  return null;
};


  // Fetch existing popup data
  useEffect(() => {
    fetchPopupData();
  }, []);

const fetchPopupData = async () => {
  try {
    setLoading(true);
    
    // For admin panel, we need to fetch popup regardless of active status
    // Add a query parameter to differentiate admin requests
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch("/api/offer-popup?admin=true", {
      headers
    });
    
    // Don't throw error on 404 - it just means no popup exists yet
    if (response.status === 404) {
      console.log('No popup exists yet - this is normal for first time');
      setLoading(false);
      return;
    }
    
    const result = await response.json();

    if (result.success && result.data) {
      setFormData({
        headline: result.data.headline || "JOIN OUR",
        title: result.data.title || "NEWSLETTER",
        subtitle: result.data.subtitle || "TO RECEIVE NEW EXCLUSIVE DEALS 50%",
        isActive: result.data.isActive || false,
        displayRules: result.data.displayRules || {
          triggerType: "scroll",
          delaySeconds: 0,
          showOnce: true,
        },
      });
      setImagePreview(result.data.imageSrc || "");
      setPopupExists(true);
      setPopupId(result.data._id);
    }
  } catch (err) {
    console.error("Error fetching popup:", err);
  } finally {
    setLoading(false);
  }
};


  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      MySwal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "Only JPEG, PNG, and WebP are allowed",
        confirmButtonColor: "#8B5CF6",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      MySwal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Maximum file size is 10MB",
        confirmButtonColor: "#8B5CF6",
      });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload image to backend
  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const uploadFormData = new FormData();
      uploadFormData.append("image", imageFile);

      const response = await fetch("/api/offer-popup", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to upload image");
      }

      return result.data.url;
    } catch (err) {
      throw new Error(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getAuthToken();
      if (!token) {
        MySwal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "You must be logged in as admin",
          confirmButtonColor: "#8B5CF6",
        });
        return;
      }

      // Step 1: Save popup data
      const response = await fetch("/api/offer-popup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save popup");
      }

      // Step 2: Upload image if new image selected
      if (imageFile) {
        await uploadImage();
      }

      setPopupExists(true);
      setPopupId(result.data._id);
      setImageFile(null);

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: result.message,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });

      // Refresh data
      setTimeout(() => {
        fetchPopupData();
      }, 500);
    } catch (err) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: "#8B5CF6",
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        MySwal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "You must be logged in as admin",
          confirmButtonColor: "#8B5CF6",
        });
        return;
      }

      const response = await fetch("/api/offer-popup", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !formData.isActive,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to toggle status");
      }

      setFormData({ ...formData, isActive: !formData.isActive });
      
      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: result.message,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (err) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: "#8B5CF6",
      });
    }
  };

  // Delete popup
  const handleDelete = async () => {
    const result = await MySwal.fire({
      title: "Delete Popup?",
      text: "Are you sure you want to delete this popup? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const token = getAuthToken();
      if (!token) {
        MySwal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "You must be logged in as admin",
          confirmButtonColor: "#8B5CF6",
        });
        return;
      }

      const response = await fetch("/api/offer-popup", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const deleteResult = await response.json();

      if (!deleteResult.success) {
        throw new Error(deleteResult.error || "Failed to delete popup");
      }

      // Reset form
      setFormData({
        headline: "JOIN OUR",
        title: "NEWSLETTER",
        subtitle: "TO RECEIVE NEW EXCLUSIVE DEALS 50%",
        isActive: false,
        displayRules: {
          triggerType: "scroll",
          delaySeconds: 0,
          showOnce: true,
        },
      });
      setImagePreview("");
      setImageFile(null);
      setPopupExists(false);
      setPopupId(null);

      MySwal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Popup has been deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (err) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: "#8B5CF6",
      });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading popup data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Settings className="text-purple-600" size={40} />
            Offer Popup Management
          </h1>
          <p className="text-gray-600">Create and manage your promotional popup</p>
        </motion.div>

        {/* Status Badge */}
        {popupExists && (
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm p-4">
              <span className="text-gray-700 font-medium">Popup Status:</span>
              <button
                onClick={handleToggleActive}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  formData.isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {formData.isActive ? (
                  <>
                    <ToggleRight size={20} />
                    Active
                  </>
                ) : (
                  <>
                    <ToggleLeft size={20} />
                    Inactive
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Eye size={20} />
                Preview
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 -mx-6 -mt-6 p-6 rounded-t-2xl mb-6">
              <h2 className="text-2xl font-bold text-white">Popup Content</h2>
              <p className="text-purple-100">Configure your offer popup details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <ImageIcon size={16} className="text-purple-600" />
                  Background Image *
                </label>
                <div className="border-2 border-dashed border-purple-300 rounded-xl p-4 text-center hover:border-purple-400 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview("");
                          setImageFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-purple-400 mb-2" />
                      <p className="text-gray-600 mb-2">Click to upload image</p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP up to 10MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  {!imagePreview && (
                    <label
                      htmlFor="image-upload"
                      className="mt-4 inline-block px-6 py-3 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      Choose Image
                    </label>
                  )}
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headline *
                </label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData({ ...formData, headline: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="JOIN OUR"
                  required
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.headline.length}/200 characters
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="NEWSLETTER"
                  required
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.title.length}/200 characters
                </p>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle *
                </label>
                <textarea
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                  placeholder="TO RECEIVE NEW EXCLUSIVE DEALS 50%"
                  required
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.subtitle.length}/200 characters
                </p>
              </div>

              {/* Display Rules */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-purple-600" />
                  Display Rules
                </h3>

                {/* Trigger Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MousePointer size={16} className="text-purple-600" />
                    Trigger Type
                  </label>
                  <select
                    value={formData.displayRules.triggerType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayRules: {
                          ...formData.displayRules,
                          triggerType: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  >
                    <option value="scroll">On Scroll</option>
                    <option value="time">Time Delay</option>
                    <option value="immediate">Immediately</option>
                    <option value="exit">Exit Intent</option>
                  </select>
                </div>

                {/* Delay Seconds */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-purple-600" />
                    Delay (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={formData.displayRules.delaySeconds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayRules: {
                          ...formData.displayRules,
                          delaySeconds: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Show Once */}
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                  <input
                    type="checkbox"
                    id="showOnce"
                    checked={formData.displayRules.showOnce}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayRules: {
                          ...formData.displayRules,
                          showOnce: e.target.checked,
                        },
                      })
                    }
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="showOnce"
                    className="text-sm font-medium text-gray-700"
                  >
                    Show only once per session
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="submit"
                  disabled={saving || uploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving || uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {uploading ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {popupExists ? "Update Popup" : "Create Popup"}
                    </>
                  )}
                </motion.button>

                {popupExists && (
                  <motion.button
                    type="button"
                    onClick={handleDelete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={20} />
                    Delete
                  </motion.button>
                )}
              </div>
            </form>
          </motion.div>

          {/* Live Preview Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 -mx-6 -mt-6 p-6 rounded-t-2xl mb-6">
              <h2 className="text-2xl font-bold text-white">Live Preview</h2>
              <p className="text-purple-100">See how your popup will look</p>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="relative w-full h-[300px] bg-white rounded-lg shadow-lg overflow-hidden">
                {imagePreview ? (
                  <div
                    className="relative w-full h-full bg-cover bg-center flex items-center justify-center"
                    style={{
                      backgroundImage: `url(${imagePreview})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
                    <div className="relative text-center px-4 z-10">
                      <p className="text-sm tracking-widest text-white mb-2">
                        {formData.headline || "HEADLINE"}
                      </p>
                      <h2 className="text-4xl font-extrabold text-white tracking-wide mb-2">
                        {formData.title || "TITLE"}
                      </h2>
                      <p className="text-white font-medium">
                        {formData.subtitle || "Subtitle"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <ImageIcon size={64} className="mx-auto mb-4" />
                      <p>Upload an image to see preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Display Rules Info */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Display Settings
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <MousePointer size={14} />
                    <span>
                      Trigger:{" "}
                      {formData.displayRules.triggerType === "scroll"
                        ? "On Scroll"
                        : formData.displayRules.triggerType === "time"
                        ? "Time Delay"
                        : formData.displayRules.triggerType === "immediate"
                        ? "Immediately"
                        : "Exit Intent"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>Delay: {formData.displayRules.delaySeconds}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer size={14} />
                    <span>
                      Show Once: {formData.displayRules.showOnce ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.isActive ? (
                      <ToggleRight size={14} className="text-green-600" />
                    ) : (
                      <ToggleLeft size={14} className="text-gray-600" />
                    )}
                    <span
                      className={
                        formData.isActive
                          ? "text-green-700 font-semibold"
                          : "text-red-700 font-semibold"
                      }
                    >
                      Status: {formData.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[600px] h-[300px] bg-white p-[10px] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-[-4%] right-[2%] z-10 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>

              <div
                className="relative w-full h-full bg-cover bg-center flex items-center justify-center rounded-lg"
                style={{
                  backgroundImage: `url(${imagePreview || "/placeholder.jpg"})`,
                }}
              >
                <div className="absolute inset-0 bg-black/40 rounded-lg"></div>

                <div className="relative text-center px-4">
                  <p className="text-sm tracking-widest text-white mb-2">
                    {formData.headline}
                  </p>
                  <h2 className="text-4xl font-extrabold text-white tracking-wide mb-2">
                    {formData.title}
                  </h2>
                  <p className="text-white font-medium">{formData.subtitle}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
