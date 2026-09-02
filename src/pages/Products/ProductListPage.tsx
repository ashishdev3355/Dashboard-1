import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Copy,
  Eye,
  EyeOff,
  Archive,
  RefreshCw,
  Package,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { productService, type ProductData, type ProductFilterParams } from '../../Services/productService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/';

function getImageSrc(img?: string): string {
  if (!img) return '/product_box.png';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/uploads')) {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${base}${img}`;
  }
  return img;
}

export default function ProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter states
  const [filters, setFilters] = useState<ProductFilterParams>({
    search: '',
    category: 'all',
    vehicle_type: 'all',
    status: 'all',
    stock_status: 'all'
  });

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getAll(filters);
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters.category, filters.vehicle_type, filters.status, filters.stock_status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  // Quick Status Toggle (Published <-> Draft)
  const handleToggleStatus = async (product: ProductData) => {
    const newStatus = product.status === 'published' ? 'draft' : 'published';
    try {
      await productService.updateStatus(product.id!, newStatus);
      setActionMessage({
        text: `Product "${product.name}" is now ${newStatus.toUpperCase()}`,
        type: 'success'
      });
      loadProducts();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to update status', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Archive Product
  const handleArchive = async (product: ProductData) => {
    if (!window.confirm(`Are you sure you want to archive "${product.name}"?`)) return;
    try {
      await productService.archive(product.id!);
      setActionMessage({ text: `Product "${product.name}" archived successfully`, type: 'success' });
      loadProducts();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to archive product', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Duplicate Product
  const handleDuplicate = (product: ProductData) => {
    navigate('/Products/add', {
      state: {
        duplicateFrom: {
          ...product,
          id: undefined,
          name: `${product.name} (Copy)`,
          slug: `${product.slug || 'copy'}-${Date.now()}`,
          sku: product.sku ? `${product.sku}-COPY` : '',
          status: 'draft'
        }
      }
    });
  };

  // Extract unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" />
            Product Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all products, pricing, vehicle categories, and store visibility for <span className="font-semibold text-gray-700">/shop</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            className="p-2.5 text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh product list"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/Products/add')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 border ${
            actionMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{actionMessage.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </form>

          {/* Vehicle Type Filter */}
          <div>
            <select
              value={filters.vehicle_type}
              onChange={(e) => setFilters({ ...filters, vehicle_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Vehicles (Bike & Car)</option>
              <option value="bike">Bike Only</option>
              <option value="car">Car Only</option>
              <option value="both">Both (Universal)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Complete Kits">Complete Kits</option>
              <option value="Parts & Software">Parts & Software</option>
              <option value="Hardware Only">Hardware Only</option>
              {uniqueCategories
                .filter((c) => !['Complete Kits', 'Parts & Software', 'Hardware Only'].includes(c))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-sm font-medium">Loading products from database...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <Package className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-base font-semibold text-gray-800">No products found</p>
            <p className="text-xs text-gray-500">
              Try adjusting your search filters or click "Add Product" to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-3">Vehicle</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Price & MRP</th>
                  <th className="py-3.5 px-3">Stock</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-2 text-center">Sort</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {products.map((product) => {
                  const primaryImage = product.images?.[0];
                  const savings = (product.mrp || 0) > product.price ? (product.mrp || 0) - product.price : 0;
                  const discountPct = product.discount_percentage || 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                            <img
                              src={getImageSrc(primaryImage)}
                              alt={product.name}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLElement).setAttribute('src', '/product_box.png');
                              }}
                            />
                          </div>
                          <div className="max-w-xs">
                            <div className="font-bold text-gray-900 line-clamp-1">{product.name}</div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              {product.sku && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{product.sku}</span>}
                              {product.badge && (
                                <span className="bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded text-[10px] uppercase">
                                  {product.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle Type */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            product.vehicle_type === 'bike'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : product.vehicle_type === 'car'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {product.vehicle_type}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="text-xs text-gray-600 font-medium">{product.category}</span>
                      </td>

                      {/* Price & MRP */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</div>
                        {product.mrp && product.mrp > product.price && (
                          <div className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</div>
                        )}
                        {savings > 0 && (
                          <div className="text-[11px] font-semibold text-emerald-600">
                            Save ₹{savings.toLocaleString('en-IN')} ({discountPct}%)
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            (product.stock || 0) > 10
                              ? 'bg-emerald-50 text-emerald-700'
                              : (product.stock || 0) > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {product.stock ?? 0} units
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            product.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : product.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3.5 px-2 text-center font-mono text-xs text-gray-500">
                        {product.sort_order ?? 0}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/Products/edit/${product.id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Quick Publish / Unpublish Toggle */}
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              product.status === 'published'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={product.status === 'published' ? 'Unpublish (Make Draft)' : 'Publish to Shop'}
                          >
                            {product.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Duplicate Product"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Archive */}
                          {product.status !== 'archived' && (
                            <button
                              onClick={() => handleArchive(product)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Archive Product"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
