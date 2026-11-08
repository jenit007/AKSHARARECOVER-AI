import React, { useState } from 'react';
import { Languages, Edit3, RefreshCw } from 'lucide-react';
import { generateTranslation, editTranslation } from '../../services/translationService';
import { useAuth } from '../../context/AuthContext';

export default function TranslationPanel({
  manuscriptId,
  translationData,
  sourceText,
  sourceLanguage = 'mal',
  onTranslationUpdated,
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState('contextual');
  const [translating, setTranslating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    translationData?.translated_text || ''
  );
  const [reviewer, setReviewer] = useState(
    user?.full_name || 'Authenticated Scholar'
  );
  const [notes, setNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [message, setMessage] = useState(null);

  const handleGenerate = async () => {
    if (!manuscriptId) return;
    try {
      setTranslating(true);
      setMessage(null);
      const res = await generateTranslation(manuscriptId, {
        source_text: sourceText,
        source_language: sourceLanguage,
        target_language: 'en',
        translation_mode: mode,
      });
      if (res?.translated_text) {
        setEditedText(res.translated_text);
        setMessage({
          type: 'success',
          text: 'Translation generated successfully.',
        });
      } else {
        setMessage({
          type: 'error',
          text:
            res?.reason ||
            'Automated translation engine unavailable. Enter a scholarly translation manually.',
        });
      }
      if (onTranslationUpdated) onTranslationUpdated(res);
    } catch (err) {
      console.error('Translation error:', err);
      setMessage({
        type: 'error',
        text:
          err.response?.data?.message ||
          err.message ||
          'Failed to generate translation',
      });
    } finally {
      setTranslating(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!manuscriptId || !editedText.trim()) return;

    try {
      setSavingEdit(true);
      setMessage(null);
      const res = await editTranslation(manuscriptId, {
        corrected_translation: editedText,
        reviewer,
        notes,
      });
      setIsEditing(false);
      setMessage({
        type: 'success',
        text: 'Scholarly translation saved to manuscript record.',
      });
      if (onTranslationUpdated) onTranslationUpdated(res);
    } catch (err) {
      console.error('Translation edit error:', err);
      setMessage({
        type: 'error',
        text:
          err.response?.data?.message ||
          err.message ||
          'Failed to save translation',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#17211d] rounded-xl border border-[#35443a] p-5 shadow-xl space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#35443a] pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-[#1c2923] text-[#ccd5ae] border border-[#35443a]">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-[#f1f2e9]">
                Historical Knowledge Translation
              </h3>
              <p className="text-xs text-[#a9b3a8]">
                Bilingual scholarly translation for Malayalam, Grantha, and Sanskrit scripts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="text-xs font-sans px-2.5 py-1.5 rounded-md border border-[#35443a] bg-[#101614] text-[#f1f2e9] focus:outline-none focus:border-[#ccd5ae]"
            >
              <option value="contextual">Contextual Epigraphical Mode</option>
              <option value="literal">Literal Word-for-Word Mode</option>
            </select>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={translating}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[#101614] bg-[#ccd5ae] hover:bg-[#e9edc9] shadow-sm disabled:opacity-50 transition-all"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${translating ? 'animate-spin' : ''}`}
              />
              <span>{translating ? 'Translating...' : 'Attempt Translate'}</span>
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border ${
              message.type === 'success'
                ? 'bg-[#ccd5ae]/15 border-[#ccd5ae]/40 text-[#ccd5ae]'
                : 'bg-[#faedcd]/15 border-[#faedcd]/40 text-[#faedcd]'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Main Display: Side-by-side Source & Translation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Text Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#77857b]">
              <span>Source Manuscript Script ({sourceLanguage})</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c2923] text-[#a9b3a8] border border-[#35443a]">
                Folio Transcript
              </span>
            </div>
            <div className="p-4 rounded-lg bg-[#101614] border border-[#35443a] font-indic text-sm leading-relaxed text-[#f1f2e9] min-h-[180px] max-h-[320px] overflow-y-auto">
              {sourceText ||
                'No source text available. Run OCR first or enter a verified transcript.'}
            </div>
          </div>

          {/* English Translation Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#77857b]">
              <span>English Translation</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c2923] text-[#d4a373] border border-[#d4a373]/40">
                {translationData?.human_edited
                  ? 'Scholar Edited'
                  : translationData?.engine || 'Translation Output'}
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <textarea
                  rows={6}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#ccd5ae] bg-[#101614] text-sm text-[#f1f2e9] focus:outline-none shadow-inner"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={reviewer}
                    onChange={(e) => setReviewer(e.target.value)}
                    placeholder="Reviewer Name"
                    className="px-2.5 py-1.5 rounded-md border border-[#35443a] bg-[#101614] text-[#f1f2e9] text-xs focus:outline-none focus:border-[#ccd5ae]"
                    required
                  />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Revision Notes"
                    className="px-2.5 py-1.5 rounded-md border border-[#35443a] bg-[#101614] text-[#f1f2e9] text-xs focus:outline-none focus:border-[#ccd5ae]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#ccd5ae] text-[#101614] shadow-sm hover:bg-[#e9edc9]"
                  >
                    {savingEdit ? 'Saving...' : 'Save Translation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-[#1c2923] text-[#a9b3a8] hover:bg-[#25372f] border border-[#35443a]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="relative p-4 rounded-lg bg-[#101614] border border-[#35443a] text-sm leading-relaxed text-[#f1f2e9] min-h-[180px] max-h-[320px] overflow-y-auto">
                {translationData?.translated_text ? (
                  <>
                    <p>{translationData.translated_text}</p>
                    <div className="mt-4 pt-3 border-t border-[#35443a] flex items-center justify-between text-xs text-[#77857b] font-mono">
                      <span>
                        Source:{' '}
                        {translationData.translation_model ||
                          translationData.engine ||
                          'Recorded Translation'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center space-x-1 text-[#ccd5ae] font-semibold hover:underline"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Translation</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-[#77857b] space-y-2">
                    <p className="text-sm">No automated translation generated.</p>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center space-x-1 text-xs font-mono text-[#ccd5ae] hover:underline"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Enter Scholarly Translation</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
