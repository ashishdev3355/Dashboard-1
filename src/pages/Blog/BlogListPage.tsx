import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Clock
} from 'lucide-react';
import { blogService, type BlogData, type BlogFilterParams } from '../../Services/blogService';

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

const CATEGORIES = [
  'Vehicle Service / Repair Tips',
  'Industry Review',
  'Product Reviews',
  'OBD Related'
];

export default function BlogListPage() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter states
  const [filters, setFilters] = useState<BlogFilterParams>({
    search: '',
    category: 'all',
    published: 'all',
    featured: 'all'
  });

  const loadBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await blogService.getAll(filters);
      setBlogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, [filters.category, filters.published, filters.featured]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBlogs();
  };

  // Quick Publish/Unpublish Toggle
  const handleTogglePublish = async (blog: BlogData) => {
    const newPublished = !blog.published;
    try {
      await blogService.updatePublishStatus(blog.id!, newPublished);
      setActionMessage({
        text: `Article "${blog.title}" is now ${newPublished ? 'PUBLISHED' : 'UNPUBLISHED'}`,
        type: 'success'
      });
      loadBlogs();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to update publish status', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Delete Article
  const handleDelete = async (blog: BlogData) => {
    if (!window.confirm(`Are you sure you want to permanently delete article "${blog.title}"?`)) return;
    try {
      await blogService.delete(blog.id!);
      setActionMessage({ text: `Article "${blog.title}" deleted successfully`, type: 'success' });
      loadBlogs();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to delete article', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Blog Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all blog articles, categories, publication status, and featured articles for <span className="font-semibold text-gray-700">/blog</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBlogs}
            className="p-2.5 text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh articles"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/Blog/add')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Article
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
              placeholder="Search by title, excerpt, slug, or tags..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </form>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Published Status Filter */}
          <div>
            <select
              value={filters.published}
              onChange={(e) => setFilters({ ...filters, published: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="true">Published</option>
              <option value="false">Unpublished (Draft)</option>
            </select>
          </div>

          {/* Featured Filter */}
          <div>
            <select
              value={filters.featured}
              onChange={(e) => setFilters({ ...filters, featured: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Visibility</option>
              <option value="true">Featured Only</option>
              <option value="false">Standard Only</option>
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

      {/* Blog Articles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-sm font-medium">Loading articles from database...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-base font-semibold text-gray-800">No blog articles found</p>
            <p className="text-xs text-gray-500">
              Try adjusting your search filters or click "Add Article" to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Article</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Published</th>
                  <th className="py-3.5 px-3">Featured</th>
                  <th className="py-3.5 px-3">Published Date</th>
                  <th className="py-3.5 px-3">Updated Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {blogs.map((blog) => {
                  return (
                    <tr key={blog.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Article Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                            {blog.featuredImage ? (
                              <img
                                src={getImageSrc(blog.featuredImage)}
                                alt={blog.title}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <BookOpen className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="max-w-md">
                            <div className="font-bold text-gray-900 line-clamp-1">{blog.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{blog.excerpt}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                                /{blog.slug}
                              </span>
                              {blog.readingTime && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                  <Clock className="w-3 h-3" />
                                  {blog.readingTime}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            blog.category === 'Vehicle Service / Repair Tips'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : blog.category === 'Industry Review'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : blog.category === 'Product Reviews'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {blog.category}
                        </span>
                      </td>

                      {/* Published Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            blog.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {blog.published ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Featured */}
                      <td className="py-3.5 px-3">
                        {blog.featured ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Featured
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Standard</span>
                        )}
                      </td>

                      {/* Published Date */}
                      <td className="py-3.5 px-3 text-xs text-gray-600 font-medium">
                        {blog.publishedDate || '—'}
                      </td>

                      {/* Updated Date */}
                      <td className="py-3.5 px-3 text-xs text-gray-400 font-mono">
                        {blog.updated_at ? new Date(blog.updated_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/Blog/edit/${blog.id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Quick Publish / Unpublish Toggle */}
                          <button
                            onClick={() => handleTogglePublish(blog)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              blog.published
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={blog.published ? 'Unpublish (Hide from website)' : 'Publish to website'}
                          >
                            {blog.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(blog)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
