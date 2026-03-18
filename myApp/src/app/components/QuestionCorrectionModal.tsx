import { X, Upload, Image, FileText, CheckCircle } from 'lucide-react';
import { useState, useRef } from 'react';

interface QuestionCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestion: string;
  onSubmitCorrection: (correctedQuestion: string, file?: File) => void;
}

export function QuestionCorrectionModal({ 
  isOpen, 
  onClose, 
  currentQuestion,
  onSubmitCorrection 
}: QuestionCorrectionModalProps) {
  const [correctedText, setCorrectedText] = useState(currentQuestion);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = () => {
    if (correctedText.trim() || uploadedFile) {
      onSubmitCorrection(correctedText.trim(), uploadedFile || undefined);
      onClose();
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400 px-6 py-4 relative sticky top-0 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
          >
            <X size={18} className="text-white" />
          </button>
          <h2 className="text-[18px] font-bold text-white pr-8">
            ✏️ Correct Your Question
          </h2>
          <p className="text-[12px] text-white text-opacity-90 mt-1">
            Update the text or upload a clearer image
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Question Display */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide mb-2">
              Current Question:
            </h3>
            <p className="text-[13px] text-gray-600 italic">
              {currentQuestion || "No question text"}
            </p>
          </div>

          {/* Text Correction */}
          <div>
            <label className="text-[14px] font-bold text-gray-900 mb-2 block">
              Corrected Question Text
            </label>
            <textarea
              value={correctedText}
              onChange={(e) => setCorrectedText(e.target.value)}
              placeholder="Type the corrected version of your question here..."
              className="w-full h-[120px] px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-[14px] text-gray-900 resize-none focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* File Upload Section */}
          <div>
            <label className="text-[14px] font-bold text-gray-900 mb-2 block">
              Upload Corrected Image/File
            </label>
            
            {/* Upload Button */}
            {!uploadedFile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[80px] border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <Upload size={24} />
                <span className="text-[13px] font-medium">Click to upload file</span>
                <span className="text-[11px] text-gray-500">PDF, PNG, JPG (max 10MB)</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File Preview */}
            {uploadedFile && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {preview ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={28} className="text-blue-600" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        <span className="text-[11px] font-medium">Ready to upload</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRemoveFile}
                    className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors flex-shrink-0"
                  >
                    <X size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="text-[13px] font-bold text-blue-900 mb-2">💡 Tips for Better Results</h4>
            <ul className="space-y-1 text-[12px] text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Make sure your question is clear and complete</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Upload images with good lighting and clarity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Include all relevant information</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!correctedText.trim() && !uploadedFile}
              className="w-full h-[48px] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium text-[15px] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              <span>Submit Correction & Regenerate</span>
            </button>

            <button
              onClick={onClose}
              className="w-full h-[40px] bg-transparent text-gray-600 rounded-xl font-medium text-[14px] hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
