import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  FileText,
  Sparkles,
  Tag,
  Image as ImageIcon,
  User,
  Clock,
  Calendar
} from 'lucide-react';
import { blogService, type BlogData } from '../../Services/blogService';

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

const CATEGORIES = [
  'Vehicle Service / Repair Tips',
  'Industry Review',
  'Product Reviews',
  'OBD Related'
];

export default function BlogFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [readingTime, setReadingTime] = useState('5 min read');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [publishedDate, setPublishedDate] = useState(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  });

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Featured Image
  const [featuredImage, setFeaturedImage] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Author Details
  const [authorName, setAuthorName] = useState('OBD Smart Team');
  const [authorRole, setAuthorRole] = useState('Technical Editor');

  // Auto-generate slug from title in Create mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditMode && !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      );
    }
  };

  // Load existing blog if editing
  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      blogService
        .getById(id)
        .then((blog) => {
          setTitle(blog.title || '');
          setSlug(blog.slug || '');
          setCategory(blog.category || CATEGORIES[0]);
          setReadingTime(blog.readingTime || '5 min read');
          setExcerpt(blog.excerpt || '');
          setContent(blog.content || '');
          setFeatured(Boolean(blog.featured));
          setPublished(Boolean(blog.published));
          setPublishedDate(blog.publishedDate || '');
          setTags(Array.isArray(blog.tags) ? blog.tags : []);
          setFeaturedImage(blog.featuredImage || '');
          if (blog.author) {
            setAuthorName(blog.author.name || 'OBD Smart Team');
            setAuthorRole(blog.author.role || 'Technical Editor');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to load article details');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  // Tag Handlers
  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      const res = await blogService.uploadImage(file);
      setFeaturedImage(res.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Manual Image URL Handler
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFeaturedImage(imageUrlInput.trim());
    setImageUrlInput('');
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Article Title is required.');
      return;
    }

    if (!category || !CATEGORIES.includes(category)) {
      setError('Please select a valid category from the options.');
      return;
    }

    const payload: Partial<BlogData> = {
      title: title.trim(),
      slug: slug.trim() || title.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
      category,
      readingTime: readingTime.trim() || '5 min read',
      excerpt: excerpt.trim(),
      content: content.trim(),
      featured,
      published,
      publishedDate: publishedDate.trim(),
      tags: tags.filter((t) => t.trim().length > 0),
      featuredImage: featuredImage.trim(),
      author: {
        name: authorName.trim() || 'OBD Smart Team',
        role: authorRole.trim() || 'Technical Editor'
      }
    };

    setSubmitting(true);
    try {
      if (isEditMode && id) {
        // Update existing record: retains exact same ID without duplicating!
        await blogService.update(id, payload);
        setSuccessMessage('Article updated successfully!');
      } else {
        await blogService.create(payload);
        setSuccessMessage('Article created successfully!');
      }

      setTimeout(() => {
        navigate('/Blog');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save article');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p>Loading article details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/Blog')}
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Blog Article' : 'Add New Blog Article'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEditMode ? `Editing article ID: ${id}` : 'Create an article for the OBD Smart Insights blog'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/Blog')}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="blog-form"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : isEditMode ? 'Update Article' : 'Publish Article'}
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
      <form id="blog-form" onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1 — BASIC INFORMATION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Section 1 — Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Article Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diagnosing ABS Faults on BS6 Bikes: Step-by-Step Workshop Guide"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. diagnosing-abs-faults-bs6-bikes"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Public URL: <span className="font-mono text-blue-600">/blog/{slug || 'article-slug'}</span>
              </p>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Reading Time */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Estimated Reading Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. 6 min read"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Published Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Published Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Sep 21, 2026"
                  value={publishedDate}
                  onChange={(e) => setPublishedDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 — EXCERPT & CONTENT */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <FileText className="w-5 h-5 text-purple-600" />
            Section 2 — Excerpt & Article Content
          </h2>

          <div className="space-y-4">
            {/* Excerpt */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Excerpt (Preview Summary) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Brief 2-3 sentence overview displayed on blog cards and search results..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Full Markdown Content */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Article Content (Markdown) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={12}
                required
                placeholder="Write article in Markdown. Supports headings (###), subheadings (####), tables, code blocks, lists, and bold text..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-mono leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Tip: You can use standard Markdown like <code className="bg-gray-100 px-1 rounded">### Major Heading</code>, <code className="bg-gray-100 px-1 rounded">- Bullet points</code>, <code className="bg-gray-100 px-1 rounded">1. Numbered lists</code>, or Markdown tables.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3 — PUBLISHING & VISIBILITY */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Section 3 — Publishing & Visibility
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Published Toggle */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Publication Status
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {published ? 'Article is Published and visible on /blog' : 'Article is Draft and visible only in Dashboard'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Featured Article
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {featured ? 'Displays the FEATURED badge and appears in Editor’s Selection' : 'Standard article visibility'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4 — TAGS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Tag className="w-5 h-5 text-indigo-600" />
            Section 4 — Article Tags
          </h2>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-blue-500 hover:text-blue-800 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-gray-400 italic">No tags added yet.</span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. BS6 Bikes, ABS Diagnostics..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Tag
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 5 — FEATURED IMAGE */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            Section 5 — Featured Image
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Box */}
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 text-center transition-colors bg-gray-50/60 flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-xs font-bold text-gray-700 mb-1">Upload Featured Image</p>
              <p className="text-[11px] text-gray-500 mb-3">PNG, JPG, WEBP, SVG up to 10MB</p>
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                {uploadingImage ? 'Uploading...' : 'Choose Image File'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* URL Input Box */}
            <div className="flex flex-col justify-center space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Or Enter Image Path / URL
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
                  Set URL
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                You can specify an absolute URL or local path.
              </p>
            </div>
          </div>

          {/* Current Featured Image Preview */}
          {featuredImage && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded bg-gray-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={getImageSrc(featuredImage)}
                    alt="Featured preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Featured Image Attached</span>
                  <span className="text-[11px] text-gray-500 font-mono line-clamp-1">{featuredImage}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFeaturedImage('')}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Remove image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* SECTION 6 — AUTHOR DETAILS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <User className="w-5 h-5 text-gray-600" />
            Section 6 — Author Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Vikram Rajput"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Author Role / Title
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="e.g. Master Diagnostic Technician"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
