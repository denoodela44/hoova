import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Upload, X, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Gavel, Tag } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'

const STEPS = ['Category', 'Details', 'Photos', 'Location', 'Review']

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo',
  'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti',
]

export default function PostListing() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const [step, setStep] = useState(0)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [newListingId, setNewListingId] = useState(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { condition: 'used', currency: 'GHS' }
  })

  const selectedCategory = watch('category_id')
  const listingType = watch('listing_type') || 'fixed'
  const title = watch('title') || ''
  const description = watch('description') || ''
  const price = watch('price')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
    staleTime: Infinity,
  })

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', selectedCategory],
    queryFn: () => api.get(`/categories?parent_id=${selectedCategory}`).then((r) => r.data.data),
    enabled: !!selectedCategory,
  })

  if (!isLoggedIn()) {
    navigate('/login', { state: { from: '/post' } })
    return null
  }

  // Quality score 0-100
  const quality = Math.min(100, [
    title.length >= 10 ? 20 : Math.round((title.length / 10) * 20),
    description.length >= 50 ? 25 : Math.round((description.length / 50) * 25),
    images.length >= 3 ? 30 : Math.round((images.length / 3) * 30),
    price ? 15 : 0,
    selectedCategory ? 10 : 0,
  ].reduce((a, b) => a + b, 0))

  const qualityColor = quality >= 70 ? 'bg-green-500' : quality >= 40 ? 'bg-yellow-500' : 'bg-red-400'
  const qualityLabel = quality >= 70 ? 'Great listing!' : quality >= 40 ? 'Getting better' : 'Needs more detail'

  const handleImageUpload = useCallback(async (files) => {
    if (images.length + files.length > 10) {
      alert('Maximum 10 images allowed')
      return
    }
    setUploading(true)
    const previews = Array.from(files).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      uploading: true,
      url: null,
    }))
    setImages((prev) => [...prev, ...previews])

    for (const item of previews) {
      try {
        const form = new FormData()
        form.append('image', item.file)
        const res = await api.post('/uploads/image', form)
        setImages((prev) =>
          prev.map((img) =>
            img.preview === item.preview ? { ...img, url: res.data.url, uploading: false } : img
          )
        )
      } catch (_) {
        setImages((prev) => prev.filter((img) => img.preview !== item.preview))
      }
    }
    setUploading(false)
  }, [images.length])

  const removeImage = (preview) => {
    setImages((prev) => prev.filter((img) => img.preview !== preview))
  }

  const onSubmit = async (data) => {
    if (images.some((img) => img.uploading)) {
      alert('Please wait for images to finish uploading')
      return
    }
    try {
      const payload = {
        ...data,
        price: Number(data.price),
        images: images.filter((img) => img.url).map((img) => ({ url: img.url })),
      }
      const res = await api.post('/listings', payload)
      setNewListingId(res.data.data.id)
      setSubmitted(true)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post listing')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Listing Posted!</h2>
        <p className="text-gray-500 mb-6">Your ad is now live and visible to buyers across Ghana.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(`/listing/${newListingId}`)} className="btn-primary">View listing</button>
          <button onClick={() => { setSubmitted(false); setStep(0); setImages([]) }} className="btn-secondary">Post another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Post Your Ad</h1>

      {/* Progress stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all
                ${i === step ? 'bg-brand-500 text-gray-900' :
                  i < step ? 'bg-green-100 text-green-700 cursor-pointer' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
            >
              {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
              {s}
            </button>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      {/* Quality meter */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Listing quality</span>
          <span className={`text-xs font-semibold ${quality >= 70 ? 'text-green-600' : quality >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
            {quality}% — {qualityLabel}
          </span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full ${qualityColor} rounded-full transition-all duration-500`} style={{ width: `${quality}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-6 space-y-5">
          {/* Step 0: Category */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-base">Choose a category</h2>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category *</label>
                <select
                  className={`input ${errors.category_id ? 'border-red-400' : ''}`}
                  {...register('category_id', { required: 'Select a category' })}
                >
                  <option value="">-- Select category --</option>
                  {categories.filter((c) => !c.parent_id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id.message}</p>}
              </div>

              {subcategories.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Subcategory</label>
                  <select className="input" {...register('subcategory_id')}>
                    <option value="">-- Select subcategory --</option>
                    {subcategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-base">Describe your item</h2>

              {/* Listing type selector */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Listing type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'fixed', icon: <Tag className="w-4 h-4" />, label: 'Fixed Price', desc: 'Set a price, buyers contact you' },
                    { value: 'auction', icon: <Gavel className="w-4 h-4" />, label: 'Auction', desc: 'Buyers bid — highest wins' },
                  ].map((t) => (
                    <label
                      key={t.value}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: `1.5px solid ${listingType === t.value ? '#B81365' : '#e5e7eb'}`,
                        background: listingType === t.value ? '#fdf2f5' : '#fafafa',
                      }}
                    >
                      <input
                        type="radio"
                        value={t.value}
                        {...register('listing_type')}
                        className="mt-0.5 shrink-0"
                        style={{ accentColor: '#B81365' }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                          <span style={{ color: listingType === t.value ? '#B81365' : '#9ca3af' }}>{t.icon}</span>
                          {t.label}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label>
                <input
                  placeholder="e.g. iPhone 14 Pro Max 256GB Space Black"
                  className={`input ${errors.title ? 'border-red-400' : ''}`}
                  {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Title too short' }, maxLength: { value: 100, message: 'Title too long' } })}
                />
                <div className="flex justify-between mt-1">
                  {errors.title ? <p className="text-xs text-red-500">{errors.title.message}</p> : <span />}
                  <span className="text-xs text-gray-400">{title.length}/100</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description *</label>
                <textarea
                  rows={5}
                  placeholder="Describe the item's condition, features, reason for selling, etc."
                  className={`input resize-none ${errors.description ? 'border-red-400' : ''}`}
                  {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Please describe your item in more detail' } })}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? <p className="text-xs text-red-500">{errors.description.message}</p> : <span />}
                  <span className="text-xs text-gray-400">{description.length} chars</span>
                </div>
              </div>

              {listingType === 'auction' ? (
                /* ── Auction fields ── */
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Starting bid (GHS) *</label>
                      <input
                        type="number" placeholder="0" min="0"
                        className={`input ${errors.price ? 'border-red-400' : ''}`}
                        {...register('price', { required: 'Starting bid is required', min: { value: 1, message: 'Must be greater than 0' } })}
                      />
                      {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Condition *</label>
                      <select className="input" {...register('condition')}>
                        <option value="new">New</option>
                        <option value="used">Used</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Auction end date & time *</label>
                    <input
                      type="datetime-local"
                      className={`input ${errors.auction_end_at ? 'border-red-400' : ''}`}
                      min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                      {...register('auction_end_at', { required: 'Set an end date and time' })}
                    />
                    {errors.auction_end_at && <p className="text-xs text-red-500 mt-1">{errors.auction_end_at.message}</p>}
                    <p className="text-xs text-gray-400 mt-1">Must be at least 1 hour from now. Tip: 3–7 days gets the most bids.</p>
                  </div>
                  <div
                    className="flex items-start gap-2 text-xs rounded-xl p-3"
                    style={{ background: '#fdf2f5', color: '#B81365' }}
                  >
                    <Gavel className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    Bidders must be logged in. You'll be notified when the auction ends and can contact the winner directly.
                  </div>
                </div>
              ) : (
                /* ── Fixed price fields ── */
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Price (GHS) *</label>
                      <input
                        type="number" placeholder="0" min="0"
                        className={`input ${errors.price ? 'border-red-400' : ''}`}
                        {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be positive' } })}
                      />
                      {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Condition *</label>
                      <select className="input" {...register('condition')}>
                        <option value="new">New</option>
                        <option value="used">Used</option>
                      </select>
                    </div>
                  </div>
                  <label
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer select-none transition-colors"
                    style={{ background: watch('negotiable') ? '#fdf2f5' : '#fafafa', border: `1px solid ${watch('negotiable') ? '#F8C0C8' : '#f0f0f0'}` }}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{ accentColor: '#B81365' }}
                      {...register('negotiable')}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Willing to negotiate</p>
                      <p className="text-xs text-gray-400 mt-0.5">Buyers will see a "Negotiable" badge and can send you offers</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Photos */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base">Add photos</h2>
                <span className="text-xs text-gray-400">{images.length}/10 photos</span>
              </div>

              <div
                className="border-2 border-dashed border-gray-200 dark:border-dark-border rounded-2xl p-8 text-center cursor-pointer hover:border-brand-400 transition-colors"
                onClick={() => document.getElementById('img-upload').click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files) }}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Drag photos here or <span className="text-brand-600 font-medium">browse</span></p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG — max 5MB each. Up to 10 photos.</p>
                <input
                  id="img-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={img.preview} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      {img.uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-brand-500 text-gray-900 font-bold px-1.5 py-0.5 rounded">Cover</span>}
                      <button
                        type="button"
                        onClick={() => removeImage(img.preview)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  Listings with photos get 5× more views. Add at least 1 photo.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-base">Where are you located?</h2>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Region *</label>
                <select
                  className={`input ${errors.region ? 'border-red-400' : ''}`}
                  {...register('region', { required: 'Select a region' })}
                >
                  <option value="">-- Select region --</option>
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">City / Town *</label>
                <input
                  placeholder="e.g. Accra, Kumasi, Takoradi..."
                  className={`input ${errors.city ? 'border-red-400' : ''}`}
                  {...register('city', { required: 'City is required' })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Neighbourhood / Area</label>
                <input
                  placeholder="e.g. East Legon, Osu, Asokwa..."
                  className="input"
                  {...register('area')}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-base">Review & Publish</h2>
              <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                Your listing will be visible to buyers across Ghana immediately after posting.
              </div>
              <button type="submit" className="btn-primary w-full text-base py-3">
                🚀 Publish Listing
              </button>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-0"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="btn-primary"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
