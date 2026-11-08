import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Users,
  Camera,
  Music,
  Video,
  BookOpen,
} from 'lucide-react';
import { submitContribution } from '../services/contributionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ContributeHeritage() {
  const { user } = useAuth();
  const toast = useToast();

  const [contentType, setContentType] = useState('manuscript');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Performing Arts');
  const [artForm, setArtForm] = useState('');
  const [language] = useState('Malayalam');
  const [script] = useState('Malayalam');
  const [district, setDistrict] = useState('Kannur');
  const [historicalPeriod] = useState('');
  const [contributorName, setContributorName] = useState(user?.full_name || '');
  const [originalCreator, setOriginalCreator] = useState('');
  const [attributionPreference, setAttributionPreference] = useState('PUBLIC_NAME');

  const [permissionStore, setPermissionStore] = useState(false);
  const [permissionDisplay, setPermissionDisplay] = useState(false);
  const [permissionReuse, setPermissionReuse] = useState(false);

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (user?.full_name && !contributorName) {
      setContributorName(user.full_name);
    }
  }, [user?.full_name]);

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    if (file.type.startsWith('image/')) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!permissionStore || !permissionDisplay) {
      setErrorMessage(
        'Explicit permission to store and display this cultural contribution is required.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const formData = new FormData();
      if (mediaFile) formData.append('media_file', mediaFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('cultural_category', category);
      if (artForm.trim()) formData.append('art_form', artForm.trim());
      formData.append('language', language);
      formData.append('script', script);
      formData.append('region', 'Kerala');
      formData.append('state', 'Kerala');
      if (district.trim()) formData.append('district', district.trim());
      if (historicalPeriod.trim())
        formData.append('historical_period', historicalPeriod.trim());
      formData.append(
        'contributor_name',
        contributorName.trim() || user?.full_name || 'Community Custodian'
      );
      if (originalCreator.trim())
        formData.append('original_creator', originalCreator.trim());
      formData.append('attribution_preference', attributionPreference);
      formData.append('content_type', contentType);
      formData.append('permission_to_store', String(permissionStore));
      formData.append('permission_to_display', String(permissionDisplay));
      formData.append('permission_to_publish', String(permissionReuse));

      const record = await submitContribution(formData);
      setSubmittedRecord(record);
      toast.success('Cultural contribution saved to the archival ledger.');
    } catch (err) {
      console.error('Contribution failed:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Submission failed. Please verify the required fields.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101614] text-[#f1f2e9] py-16 px-4 sm:px-6 lg:px-8 space-y-12 selection:bg-[#ccd5ae]/30">
      {/* Header */}
      <section className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1c2923] border border-[#35443a] text-xs font-mono text-[#ccd5ae]">
          <Heart className="w-3.5 h-3.5 text-[#ccd5ae]" />
          <span>Community Heritage Custodianship</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#fefae0] tracking-tight">
          Contribute Cultural Heritage
        </h1>
        <p className="text-lg text-[#a9b3a8] max-w-2xl mx-auto font-sans leading-relaxed">
          Document palm-leaf folios, traditional art forms, and regional historical context with explicit custodial attribution.
        </p>
      </section>

      {submittedRecord ? (
        <div className="max-w-2xl mx-auto animate-fade-in">
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-[#17211d] border-2 border-[#d4a373] space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#ccd5ae]/20 text-[#ccd5ae] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#d4a373] font-bold">
                Submission Saved in Database
              </span>
              <h2 className="font-heading text-3xl font-bold text-[#fefae0] mt-1">
                {submittedRecord.title || title}
              </h2>
              <p className="text-xs text-[#77857b] font-mono mt-1">
                Contribution ID: {submittedRecord.contribution_id || submittedRecord.id}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#101614] border border-[#35443a] text-xs text-[#a9b3a8] space-y-2 text-left font-mono">
              <div className="flex justify-between">
                <span>Review Status:</span>
                <span className="text-[#d4a373] font-bold">
                  {submittedRecord.review_status || 'PENDING_REVIEW'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="text-[#f1f2e9]">
                  {submittedRecord.cultural_category || category}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Attribution:</span>
                <span className="text-[#ccd5ae]">
                  {submittedRecord.contributor_name || contributorName}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubmittedRecord(null);
                setTitle('');
                setDescription('');
                setMediaFile(null);
                setMediaPreview(null);
              }}
              className="px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] font-mono"
            >
              Submit Another Contribution
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-[#faedcd]/15 border border-[#d4a373] text-[#faedcd] text-xs sm:text-sm font-medium">
                {errorMessage}
              </div>
            )}

            {/* Step 1: Contribution Media Type */}
            <div className="p-6 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
              <h2 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#ccd5ae]" />
                <span>1. Select Contribution Modality</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'manuscript', label: 'Palm Leaf Folio', icon: BookOpen },
                  { id: 'image', label: 'Heritage Photo', icon: Camera },
                  { id: 'audio', label: 'Oral Chanting', icon: Music },
                  { id: 'video', label: 'Ritual Footage', icon: Video },
                  { id: 'text', label: 'Written Note', icon: FileText },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = contentType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setContentType(item.id)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                        isSelected
                          ? 'bg-[#ccd5ae] text-[#101614] border-[#ccd5ae] shadow-md font-bold'
                          : 'bg-[#101614] text-[#a9b3a8] border-[#35443a] hover:bg-[#1c2923] hover:text-[#f1f2e9]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Cultural Heritage Information */}
            <div className="p-8 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-5 shadow-xl">
              <h2 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2 border-b border-[#35443a] pb-3">
                <Users className="w-5 h-5 text-[#d4a373]" />
                <span>2. Tradition &amp; Provenance Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono">
                    Heritage Item Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chirakkal Theyyam Thottam Song Manuscript"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono">
                    Cultural Description &amp; Context *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the tradition, regional significance, or family provenance..."
                    className="w-full p-3.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:border-[#ccd5ae] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono">
                    Cultural Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] focus:outline-none focus:border-[#ccd5ae]"
                  >
                    <option value="Performing Arts">Performing Arts</option>
                    <option value="Ritual Traditions">Ritual Traditions</option>
                    <option value="Crafts & Metallurgy">Traditional Crafts</option>
                    <option value="Indigenous Medicine">Ayurveda &amp; Herbology</option>
                    <option value="Oral Folklore">Oral Epics &amp; Folklore</option>
                    <option value="Sacred Architecture">Architecture &amp; Kavu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono">
                    Specific Tradition / Art Form
                  </label>
                  <input
                    type="text"
                    value={artForm}
                    onChange={(e) => setArtForm(e.target.value)}
                    placeholder="e.g. Theyyam, Kathakali, Sopana Sangeetham"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:outline-none focus:border-[#ccd5ae]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono">
                    District / Locality (Kerala)
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Kannur, Thrissur, Palakkad"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:outline-none focus:border-[#ccd5ae]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono">
                    Original Creator / Tradition Bearer
                  </label>
                  <input
                    type="text"
                    value={originalCreator}
                    onChange={(e) => setOriginalCreator(e.target.value)}
                    placeholder="Optional (if known)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:outline-none focus:border-[#ccd5ae]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono">
                    Contributor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] placeholder-[#77857b] focus:outline-none focus:border-[#ccd5ae]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1 font-mono">
                    Attribution Preference
                  </label>
                  <select
                    value={attributionPreference}
                    onChange={(e) => setAttributionPreference(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#35443a] bg-[#101614] text-sm text-[#f1f2e9] focus:outline-none focus:border-[#ccd5ae]"
                  >
                    <option value="PUBLIC_NAME">Public Name Credit</option>
                    <option value="ORGANIZATION">Institution / Community Credit</option>
                    <option value="ANONYMOUS">Anonymous Custodian</option>
                  </select>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-[#35443a]">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a9b3a8] mb-1.5 font-mono">
                    Optional Media Asset (Image, PDF, Audio)
                  </label>
                  <input
                    type="file"
                    onChange={handleMediaChange}
                    className="block w-full text-xs text-[#77857b] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1c2923] file:text-[#ccd5ae] hover:file:bg-[#25372f] cursor-pointer"
                  />
                  {mediaPreview && (
                    <div className="mt-3 p-2 bg-[#101614] border border-[#35443a] rounded-lg max-h-48 flex items-center justify-center">
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="max-h-44 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Consent & Rights */}
            <div className="p-8 rounded-2xl bg-[#17211d] border border-[#35443a] space-y-4 shadow-xl">
              <h2 className="font-heading text-lg font-bold text-[#f1f2e9] flex items-center space-x-2 border-b border-[#35443a] pb-3">
                <ShieldCheck className="w-5 h-5 text-[#d4a373]" />
                <span>3. Consent &amp; Attribution Rights</span>
              </h2>

              <div className="space-y-3 pt-2">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissionStore}
                    onChange={(e) => setPermissionStore(e.target.checked)}
                    className="mt-1 accent-[#ccd5ae] w-4 h-4 rounded"
                    required
                  />
                  <div className="text-xs text-[#a9b3a8]">
                    <strong className="block text-[#f1f2e9]">
                      Permission to Store &amp; Preserve (Required)
                    </strong>
                    I permit AKSHARARECOVER AI to store this contribution in its preservation database.
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissionDisplay}
                    onChange={(e) => setPermissionDisplay(e.target.checked)}
                    className="mt-1 accent-[#ccd5ae] w-4 h-4 rounded"
                    required
                  />
                  <div className="text-xs text-[#a9b3a8]">
                    <strong className="block text-[#f1f2e9]">
                      Permission to Display for Educational Research (Required)
                    </strong>
                    I permit educational and non-commercial scholarly attribution of this record.
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissionReuse}
                    onChange={(e) => setPermissionReuse(e.target.checked)}
                    className="mt-1 accent-[#ccd5ae] w-4 h-4 rounded"
                  />
                  <div className="text-xs text-[#a9b3a8]">
                    <strong className="block text-[#f1f2e9]">
                      Permission for Academic Reuse (Optional)
                    </strong>
                    Permit computational linguistic and historical citation under CC-BY-NC-SA 4.0.
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !permissionStore || !permissionDisplay}
                  className="px-8 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-md disabled:opacity-50 transition-all font-mono"
                >
                  {submitting
                    ? 'Submitting to Archive...'
                    : 'Submit Cultural Contribution'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
