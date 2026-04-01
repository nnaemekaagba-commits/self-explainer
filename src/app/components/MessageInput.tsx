import { Plus, Image, FileText, File, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { TinyFlippingBook } from './TinyFlippingBook';
import { solveProblem } from '../../services/aiService';

// Compress image for faster upload and processing
async function compressImage(dataUrl: string, quality: number = 0.7, maxWidth: number = 1200): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Resize if image is too large
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with quality setting for better compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.src = dataUrl;
  });
}

interface MessageInputProps {
  placeholder?: string;
  bgColor?: string;
  onNavigate?: () => void;
  onProblemSolved?: (data: any) => void;
  onQuestionSubmit?: (question: string, imageUrl?: string) => void;
  onGetCurrentInput?: (getter: () => string) => void;
  initialQuestion?: string;
  initialImageUrl?: string | null;
  prefillToken?: string | null;
  showSendButton?: boolean;
}

export function MessageInput({
  placeholder = "Type your question or paste your problem here...",
  bgColor = "#ffffff",
  onNavigate,
  onProblemSolved,
  onQuestionSubmit,
  onGetCurrentInput,
  initialQuestion,
  initialImageUrl,
  prefillToken,
  showSendButton = true
}: MessageInputProps) {
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Use ref to store the current input value so parent can access it without causing re-renders
  const inputValueRef = useRef(inputValue);

  // Update ref whenever inputValue changes
  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  // Expose a stable getter function to parent (only once on mount)
  useEffect(() => {
    if (onGetCurrentInput) {
      onGetCurrentInput(() => inputValueRef.current);
    }
  }, []);

  useEffect(() => {
    if (!prefillToken) return;
    setInputValue(initialQuestion || '');
    setUploadedImage(initialImageUrl || null);
  }, [initialImageUrl, initialQuestion, prefillToken]);

  const handleSend = async () => {
    if (inputValue.trim() || uploadedImage) {
      setIsProcessing(true);
      setError(null);

      const question = inputValue.trim();

      console.log('MessageInput - Submitting:', {
        question,
        hasImage: !!uploadedImage,
        imageLength: uploadedImage?.length || 0
      });

      if (onQuestionSubmit) {
        onQuestionSubmit(question, uploadedImage || undefined);
      }

      try {
        console.log('MessageInput - Calling solveProblem with image:', !!uploadedImage);
        const result = await solveProblem(question, uploadedImage || undefined);
        if (onProblemSolved) {
          onProblemSolved(result);
        }
        setInputValue('');
        setUploadedImage(null);
        if (onNavigate) {
          onNavigate();
        }
      } catch (err) {
        console.error('Failed to solve problem:', err);
        setError(err instanceof Error ? err.message : 'Failed to process your question');

        const demoData = {
          solution: `For the problem "${inputValue.trim()}", here's the solution: First, identify what you're solving for. Then apply the appropriate mathematical operations step by step.`,
          strategy: 'Break down the problem into smaller parts. Solve each part methodically. Verify your answer makes sense.',
          steps: [
            {
              title: "Understand the Problem",
              description: "Read carefully and identify what is being asked. Write down what you know and what you need to find.",
              formula: ""
            },
            {
              title: "Identify the Method",
              description: "Determine which mathematical concept or formula applies to this specific problem.",
              formula: ""
            },
            {
              title: "Apply the Solution",
              description: "Work through the problem step by step using the identified method. Show all your work.",
              formula: ""
            },
            {
              title: "Verify Your Answer",
              description: "Check if your solution makes sense in the context of the original problem.",
              formula: ""
            }
          ]
        };

        if (onProblemSolved) {
          onProblemSolved(demoData);
        }

        setInputValue('');
        if (onNavigate) {
          onNavigate();
        }
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleUpload = (file: File) => {
    setShowUploadMenu(false);
    setIsProcessing(true);
    setProcessingStatus('Preparing upload...');

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const fileContent = reader.result;
        let aiQuestionText = `Uploaded file: ${file.name}`;

        if (file.type.startsWith('image/')) {
          setProcessingStatus('Compressing image...');
          const imageDataUrl = await compressImage(fileContent as string, 0.7, 1200);

          console.log('MessageInput - Image uploaded:', {
            fileName: file.name,
            originalSize: file.size,
            fileType: file.type,
            compressedLength: imageDataUrl.length,
            compressionRatio: ((1 - imageDataUrl.length / (fileContent as string).length) * 100).toFixed(1) + '%'
          });

          setUploadedImage(imageDataUrl);
          if (onQuestionSubmit) {
            onQuestionSubmit(inputValueRef.current.trim(), imageDataUrl);
          }
          console.log('MessageInput - Image ready for send');
          console.log('Final size:', (imageDataUrl.length / 1024).toFixed(2), 'KB');

          setProcessingStatus('Reading question from image...');

          try {
            const result = await solveProblem(
              'Please read and extract the problem shown in this image exactly as clearly as possible.',
              imageDataUrl
            );
            const extractedText = result.extractedQuestion?.trim();

            if (extractedText) {
              setInputValue(extractedText);
            } else if (!inputValueRef.current.trim()) {
              setInputValue('Image uploaded. Add any extra instructions if you want, then click Send.');
            }
          } catch (err) {
            console.error('Failed to extract question from uploaded image:', err);
            if (!inputValueRef.current.trim()) {
              setInputValue('Image uploaded. Please type the question shown in the image, then click Send.');
            }
          }

          setProcessingStatus('');
          return;
        }

        if (file.type === 'application/pdf') {
          setInputValue(`[PDF uploaded: ${file.name}]\n\nPlease copy and paste the math problem from your PDF below, then click Send.\n\nTip: you can also upload a screenshot as an image for faster processing.`);
          setIsProcessing(false);
          return;
        }

        aiQuestionText = fileContent as string;

        try {
          const result = await solveProblem(aiQuestionText);
          const extractedText = result.extractedQuestion || aiQuestionText;

          setInputValue(extractedText);
          console.log('Extracted text from file:', extractedText);
          console.log('Full AI response:', result);
          setProcessingStatus('');
        } catch (err) {
          setProcessingStatus('');
          console.error('Failed to process uploaded file:', err);
          setInputValue(`[File uploaded: ${file.name}]\n\nPlease type the math problem below, then click Send.`);
        }
      } catch (err) {
        console.error('Error reading file:', err);
        setInputValue(`Error reading file: ${file.name}. Please try typing your question instead.`);
      } finally {
        setIsProcessing(false);
      }
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full flex items-start gap-2.5 px-0 mb-5">
      <div className="relative">
        <button
          onClick={() => setShowUploadMenu(!showUploadMenu)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white hover:opacity-80 active:opacity-60 transition-colors flex-shrink-0 mt-2 shadow-sm border border-gray-200"
        >
          <Plus size={18} className="text-gray-700" strokeWidth={2.5} />
        </button>

        {showUploadMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowUploadMenu(false)}
            />

            <div className="absolute left-0 top-12 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48">
              <label className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer">
                <Image size={18} className="text-blue-600" />
                <span className="text-[13px] text-gray-900">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </label>
              <label className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer">
                <File size={18} className="text-red-600" />
                <span className="text-[13px] text-gray-900">Upload PDF</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </label>
              <label className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer">
                <FileText size={18} className="text-blue-600" />
                <span className="text-[13px] text-gray-900">Upload Document</span>
                <input
                  type="file"
                  accept=".txt,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </label>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 relative">
        {isProcessing ? (
          <div className="w-full py-3 px-3 pr-12 rounded-3xl border border-gray-200 shadow-sm bg-gray-50 flex flex-col items-center justify-center min-h-[78px]">
            <TinyFlippingBook />
            {processingStatus && (
              <p className="text-[11px] text-gray-600 mt-2">{processingStatus}</p>
            )}
          </div>
        ) : (
          <>
            <div
              className={`w-full rounded-3xl border border-gray-200 shadow-sm transition-all duration-200 ${
                uploadedImage ? 'p-3 bg-gradient-to-br from-purple-50 to-blue-50' : ''
              }`}
              style={!uploadedImage ? { backgroundColor: bgColor } : undefined}
            >
              {uploadedImage && (
                <div className="mb-3 relative bg-white rounded-xl p-2 border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-700">Image uploaded successfully</span>
                  </div>
                  <div className="relative inline-block">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="max-w-full max-h-64 rounded-lg border border-gray-300 shadow-sm object-contain"
                    />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors shadow-lg hover:scale-110"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <textarea
                placeholder={placeholder}
                rows={uploadedImage ? 2 : 3}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={`w-full py-3 px-3 ${showSendButton ? 'pr-12' : 'pr-3'} rounded-2xl border outline-none text-[12px] text-gray-900 placeholder:text-gray-500 resize-none ${
                  uploadedImage ? 'border-purple-300 bg-white shadow-sm' : 'border-transparent'
                }`}
                style={!uploadedImage ? { backgroundColor: bgColor } : undefined}
              />
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
            {showSendButton ? (
              <button
                onClick={handleSend}
                disabled={inputValue.trim() === '' && !uploadedImage}
                className={`absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 shadow-md ${
                  inputValue.trim() === '' && !uploadedImage
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:scale-110'
                }`}
              >
                <Send size={16} className={inputValue.trim() === '' && !uploadedImage ? 'text-gray-400' : 'text-white'} />
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
