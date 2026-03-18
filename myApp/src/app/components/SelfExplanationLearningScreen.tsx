import { ArrowLeft, Lightbulb, CheckCircle, BookOpen, Brain, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface SelfExplanationLearningScreenProps {
  onBack: () => void;
}

export function SelfExplanationLearningScreen({ onBack }: SelfExplanationLearningScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "What is Self-Explanation?",
      icon: <Brain size={32} className="text-purple-600" />,
      content: "Self-explanation is the process of explaining to yourself how and why something works. Instead of just getting the right answer, you focus on understanding WHY it's right.",
      example: "❌ Bad: \"The answer is 10\"\n✅ Good: \"The answer is 10 because I added 7 + 3. I used addition because the problem asked for the total.\"",
      bgColor: "from-purple-100 to-pink-100"
    },
    {
      title: "Why Does It Help?",
      icon: <Lightbulb size={32} className="text-yellow-600" />,
      content: "When you explain concepts to yourself, your brain creates stronger connections. This helps you remember better and apply knowledge to new problems.",
      example: "Studies show students who self-explain:\n• Remember 2x more information\n• Solve problems 40% faster\n• Make fewer mistakes",
      bgColor: "from-yellow-100 to-orange-100"
    },
    {
      title: "How to Self-Explain",
      icon: <MessageSquare size={32} className="text-blue-600" />,
      content: "Follow these steps when solving problems:",
      example: "1. Read the problem carefully\n2. Think about what you already know\n3. Explain each step as you go\n4. Connect steps to the big picture\n5. Ask yourself 'Why?' and 'How?'",
      bgColor: "from-blue-100 to-cyan-100"
    },
    {
      title: "Practice Example",
      icon: <BookOpen size={32} className="text-green-600" />,
      content: "Let's practice! Problem: If Sarah has 5 apples and buys 3 more, how many does she have?",
      example: "Good self-explanation:\n\"I need to find the total. Sarah starts with 5 apples (that's my starting amount). Then she buys 3 more, which means I need to ADD. So 5 + 3 = 8. She has 8 apples total because buying more means adding to what she had.\"",
      bgColor: "from-green-100 to-emerald-100"
    },
    {
      title: "Ready to Try!",
      icon: <CheckCircle size={32} className="text-purple-600" />,
      content: "Now you're ready to practice self-explanation while solving real problems!",
      example: "Remember:\n✓ Explain each step\n✓ Say WHY you did it\n✓ Connect to what you know\n✓ Use your own words",
      bgColor: "from-purple-100 to-pink-100"
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Header with back button */}
      <div className="h-[50px] flex items-center justify-between px-6 pt-2 border-b border-gray-200 bg-white">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ArrowLeft size={20} strokeWidth={2} />
          <span className="text-[15px] font-medium">Back</span>
        </button>
        <span className="text-[15px] font-medium text-gray-900">Learn Self-Explanation</span>
        <div className="w-16"></div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50">
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-gradient-to-r from-purple-600 to-pink-600'
                    : index < currentStep
                    ? 'w-2 bg-green-500'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Step Counter */}
          <div className="text-center">
            <p className="text-[13px] text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Main Content Card */}
          <div className={`bg-gradient-to-br ${currentStepData.bgColor} rounded-2xl p-6 shadow-lg border border-gray-200`}>
            <div className="flex flex-col items-center text-center mb-4">
              <div className="mb-3">
                {currentStepData.icon}
              </div>
              <h2 className="text-[20px] font-bold text-gray-900">
                {currentStepData.title}
              </h2>
            </div>

            <p className="text-[14px] text-gray-800 leading-relaxed mb-4 text-center">
              {currentStepData.content}
            </p>
          </div>

          {/* Example Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide mb-3">
              {currentStep === 3 ? "📝 Example" : currentStep === 4 ? "✨ Key Takeaways" : "💡 Example"}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-[13px] text-gray-800 whitespace-pre-line leading-relaxed">
                {currentStepData.example}
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 h-[48px] bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-medium text-[15px] hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex-1 h-[48px] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium text-[15px] shadow-md hover:shadow-lg transition-all"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onBack}
                className="flex-1 h-[48px] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium text-[15px] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                <span>Start Learning!</span>
              </button>
            )}
          </div>

          {/* Skip Button */}
          {currentStep < steps.length - 1 && (
            <button
              onClick={onBack}
              className="w-full text-[14px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip Tutorial
            </button>
          )}
        </div>
      </div>
    </>
  );
}
