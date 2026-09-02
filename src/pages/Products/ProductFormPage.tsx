import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Check,
  Image as ImageIcon,
  Save,
  AlertCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Layers,
  DollarSign,
  FileText,
  Boxes,
  Sparkles
} from 'lucide-react';
import { productService, type ProductData } from '../../Services/productService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/';

function getImageSrc(img: string): string {
  if (!img) return '/product_box.png';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/uploads')) {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${base}${img}`;
  }
  return img;
}

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Complete Kits');
  const [customCategory, setCustomCategory] = useState('');
  const [vehicleType, setVehicleType] = useState<'bike' | 'car' | 'both'>('bike');

  // Pricing
  const [price, setPrice] = useState<number | ''>('');
  const [mrp, setMrp] = useState<number | ''>('');

  // Descriptions & Features
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Read & Clear Engine, FI & ABS Fault Codes',
    'Live graphical sensor telemetry tracking',
    'Lifetime software updates'
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Specs & Inclusions
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: 'Interface', value: 'OBD-II (16-pin Male Bluetooth)' },
    { key: 'Warranty', value: '1 Year Replacement Warranty' }
  ]);
  const [includes, setIncludes] = useState<string[]>([
    'Smart Bluetooth OBD2 Adapter',
    'Activation Card & License Key'
  ]);
  const [newIncludeText, setNewIncludeText] = useState('');
  const [compatibility, setCompatibility] = useState('');

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Store Display & Inventory
  const [badge, setBadge] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [stock, setStock] = useState<number>(50);
  const [rating, setRating] = useState<number>(5.0);
  const [reviews, setReviews] = useState<number>(0);

  // Dynamic Discount Calculation
  const savings = useMemo(() => {
    const numPrice = typeof price === 'number' ? price : 0;
    const numMrp = typeof mrp === 'number' ? mrp : 0;
    if (numMrp > numPrice && numMrp > 0) {
      const saveAmount = numMrp - numPrice;
      const pct = Math.round((saveAmount / numMrp) * 100);
      return { saveAmount, pct };
    }
    return null;
  }, [price, mrp]);

  // Handle Slug generation from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditMode && !slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  // Load existing product if editing or duplicating
  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      productService
        .getById(id)
        .then((prod) => {
          populateForm(prod);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load product details');
        })
        .finally(() => setLoading(false));
    } else if (location.state?.duplicateFrom) {
      populateForm(location.state.duplicateFrom);
    }
  }, [id, isEditMode]);

  const populateForm = (prod: ProductData) => {
    setName(prod.name || '');
    setSku(prod.sku || '');
    setSlug(prod.slug || '');
    if (['Complete Kits', 'Parts & Software', 'Hardware Only'].includes(prod.category)) {
      setCategory(prod.category);
    } else {
      setCategory('other');
      setCustomCategory(prod.category);
    }
    setVehicleType(prod.vehicle_type || 'bike');
    setPrice(prod.price ?? '');
    setMrp(prod.mrp ?? '');
    setShortDescription(prod.short_description || '');
    setFullDescription(prod.full_description || '');
    setFeatures(prod.features && prod.features.length > 0 ? prod.features : []);
    
    // Parse specs object to key-value array
    if (prod.specs && typeof prod.specs === 'object') {
      const specList = Object.entries(prod.specs).map(([key, value]) => ({ key, value }));
      setSpecs(specList);
    }
    setIncludes(prod.includes && prod.includes.length > 0 ? prod.includes : []);
    setCompatibility(prod.compatibility || '');
    setImages(prod.images && prod.images.length > 0 ? prod.images : []);
    setBadge(prod.badge || '');
    setSortOrder(prod.sort_order ?? 0);
    setStatus(prod.status || 'published');
    setStock(prod.stock ?? 0);
    setRating(prod.rating ?? 5.0);
    setReviews(prod.reviews ?? 0);
  };

  // Features list handlers
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Inclusions handlers
  const handleAddInclude = () => {
    if (!newIncludeText.trim()) return;
    setIncludes([...includes, newIncludeText.trim()]);
    setNewIncludeText('');
  };

  const handleRemoveInclude = (index: number) => {
    setIncludes(includes.filter((_, i) => i !== index));
  };

  // Specs handlers
  const handleAddSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const res = await productService.uploadImage(files[i]);
        setImages((prev) => [...prev, res.imageUrl]);
      }
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Image manual URL add
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages([...images, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    setImages([target, ...rest]);
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setImages(updated);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }

    if (price === '' || isNaN(Number(price))) {
      setError('A valid selling price is required.');
      return;
    }

    const finalCategory = category === 'other' ? customCategory.trim() || 'General' : category;

    // Convert specs array to object
    const specsObject: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim()) {
        specsObject[s.key.trim()] = s.value.trim();
      }
    });

    const payload: Partial<ProductData> = {
      name: name.trim(),
      slug: slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku: sku.trim(),
      category: finalCategory,
      vehicle_type: vehicleType,
      price: Number(price),
      mrp: mrp !== '' ? Number(mrp) : Number(price),
      short_description: shortDescription.trim(),
      full_description: fullDescription.trim() || shortDescription.trim(),
      features: features.filter((f) => f.trim().length > 0),
      specs: specsObject,
      includes: includes.filter((inc) => inc.trim().length > 0),
      compatibility: compatibility.trim(),
      images: images.length > 0 ? images : ['/product_box.png'],
      badge: badge.trim() || undefined,
      sort_order: Number(sortOrder) || 0,
      status,
      stock: Number(stock) || 0,
      rating: Number(rating) || 5.0,
      reviews: Number(reviews) || 0
    };

    setSubmitting(true);
    try {
      if (isEditMode && id) {
        await productService.update(id, payload);
        setSuccessMessage('Product updated successfully!');
      } else {
        await productService.create(payload);
        setSuccessMessage('Product created successfully!');
      }
      setTimeout(() => {
        navigate('/Products');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p>Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/Products')}
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEditMode ? `Editing product ID: ${id}` : 'Create a new product for the OBD Smart Store'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/Products')}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Publish Product'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Main Form */}
      <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1 — BASIC INFORMATION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Boxes className="w-5 h-5 text-blue-600" />
            Section 1 — Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. OBD Smart Pro • Complete 11 Cable Kit"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                SKU (Stock Keeping Unit)
              </label>
              <input
                type="text"
                placeholder="e.g. SKU-COMP-11"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* URL Slug */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                URL Slug
              </label>
              <input
                type="text"
                placeholder="e.g. obd-smart-pro-11-cables"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['bike', 'car', 'both'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVehicleType(type)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border ${
                      vehicleType === type
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {type === 'both' ? 'Both (Universal)' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Complete Kits">Complete Kits</option>
                <option value="Parts & Software">Parts & Software</option>
                <option value="Hardware Only">Hardware Only</option>
                <option value="other">Other (Custom Category)</option>
              </select>

              {category === 'other' && (
                <input
                  type="text"
                  placeholder="Enter custom category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2 — PRICING & SAVINGS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Section 2 — Pricing & Discount Calculation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Selling Price */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="12999"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* MRP */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                MRP / Original Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="15000"
                value={mrp}
                onChange={(e) => setMrp(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Savings Display Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Calculated Store Savings Line:
              </span>
              {savings ? (
                <div className="text-xs font-bold text-emerald-700 mt-1">
                  You save ₹{savings.saveAmount.toLocaleString('en-IN')} ({savings.pct}% off)
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic mt-1">No discount (Selling price equals MRP)</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3 — DESCRIPTIONS & KEY FEATURES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <FileText className="w-5 h-5 text-purple-600" />
            Section 3 — Descriptions & Key Features
          </h2>

          <div className="space-y-4">
            {/* Short Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Short Description (Shop Card Preview)
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of the kit / scanner..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Description (Detail Modal / Page)
              </label>
              <textarea
                rows={3}
                placeholder="Comprehensive technical details and breakdown..."
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Multi-Item Key Features */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Key Features (Tick Checklist Items)
              </label>

              <div className="space-y-2 mb-3">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const updated = [...features];
                        updated[idx] = e.target.value;
                        setFeatures(updated);
                      }}
                      className="flex-1 bg-transparent border-0 text-sm text-gray-800 focus:ring-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Supports standard OBD modes 01, 02, 03..."
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Feature
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4 — SPECS, INCLUSIONS & COMPATIBILITY */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Layers className="w-5 h-5 text-indigo-600" />
            Section 4 — Technical Specs, Inclusions & Compatibility
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technical Specifications Key-Value */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Technical Specifications
                </label>
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="space-y-2">
                {specs.map((spec, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Interface"
                      value={spec.key}
                      onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                      className="w-1/3 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="e.g. OBD-II Bluetooth"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Package Inclusions */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Package Inclusions (What's in the Box)
              </label>

              <div className="space-y-2 mb-2">
                {includes.map((inc, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-700 flex-1 pl-2">{inc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInclude(idx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Heavy-Duty Workshop Case"
                  value={newIncludeText}
                  onChange={(e) => setNewIncludeText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInclude();
                    }
                  }}
                  className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddInclude}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Compatibility Information */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Vehicle Compatibility Description
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Compatible with major Indian motorcycle brands: Bajaj, KTM, TVS, Honda, Suzuki, Yamaha..."
                value={compatibility}
                onChange={(e) => setCompatibility(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5 — PRODUCT IMAGES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <ImageIcon className="w-5 h-5 text-amber-600" />
            Section 5 — Persistent Product Images
          </h2>

          {/* Upload and URL input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 text-center transition-colors bg-gray-50/60 flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-xs font-bold text-gray-700 mb-1">Upload Product Images</p>
              <p className="text-[11px] text-gray-500 mb-3">PNG, JPG, WEBP, SVG up to 10MB</p>
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                {uploadingImage ? 'Uploading...' : 'Choose Image Files'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col justify-center space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Or Add Image Path / URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. /product_box.png or https://..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3.5 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-900 cursor-pointer"
                >
                  Add URL
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                You can specify local static assets like <code className="bg-gray-200 px-1 rounded">/product_box.png</code> or uploaded images.
              </p>
            </div>
          </div>

          {/* Image Previews & Ordering */}
          {images.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Product Gallery ({images.length} images) — First image is Primary
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-xl border p-2 bg-white flex flex-col justify-between group ${
                      idx === 0 ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' : 'border-gray-200'
                    }`}
                  >
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs uppercase z-10">
                        Primary
                      </span>
                    )}

                    <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                      <img
                        src={getImageSrc(img)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute('src', '/product_box.png');
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 'left')}
                            className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                            title="Move Left"
                          >
                            <ChevronUp className="w-3.5 h-3.5 rotate-270" />
                          </button>
                        )}
                        {idx < images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 'right')}
                            className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                            title="Move Right"
                          >
                            <ChevronDown className="w-3.5 h-3.5 rotate-270" />
                          </button>
                        )}
                      </div>

                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          Make Primary
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6 — STORE DISPLAY & INVENTORY */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Section 6 — Store Display & Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Badge */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Marketing Badge
              </label>
              <input
                type="text"
                placeholder="e.g. Best Seller, Premium Pick"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Display Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Inventory Stock
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Publication Status */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Store Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold bg-white cursor-pointer"
              >
                <option value="published">Published (Visible on /shop)</option>
                <option value="draft">Draft (Hidden from public)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/Products')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
