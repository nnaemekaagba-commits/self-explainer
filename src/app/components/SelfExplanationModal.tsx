import { X, Brain, MessageSquare, Lightbulb, Target } from 'lucide-react';

interface SelfExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SelfExplanationModal({ isOpen, onClose }: SelfExplanationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">What is Self-Explanation?</h2>
                <p className="text-purple-100 text-sm mt-1">Evidence-based strategy—students who explain learn better (VanLehn et al., 1992)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Definition */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h3 className="font-bold text-lg text-purple-900 mb-2">Definition</h3>
            <p className="text-gray-700 leading-relaxed">
              Self-explanation is "a process by which learners generate inferences about causal connections or conceptual relationships" (Bisra et al., 2018, p. 703). It involves "generating explanations for oneself" to promote transfer and deeper understanding (Rittle-Johnson, 2006, p. 1). Instead of passively reading solutions, you actively engage by "filling in the details that the example left out and by highlighting the relationships between general pieces of domain knowledge and specific actions" (VanLehn et al., 1992, p. 3). Research consistently shows that <strong>students who explain examples to themselves learn better, make more accurate self-assessments of their understanding, and solve problems more effectively</strong> (VanLehn et al., 1992).
            </p>
          </div>

          {/* Why It Works */}
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Why Self-Explanation Works
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-purple-500 font-bold">✓</span>
                <span><strong>Deepens understanding:</strong> Forces you to process information beyond surface level</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-500 font-bold">✓</span>
                <span><strong>Reveals gaps:</strong> Helps identify what you don't understand yet</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-500 font-bold">✓</span>
                <span><strong>Improves retention:</strong> Creates stronger memory connections</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-500 font-bold">✓</span>
                <span><strong>Builds problem-solving skills:</strong> Develops critical thinking and reasoning</span>
              </li>
            </ul>
          </div>

          {/* Key Skills */}
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-pink-500" />
              Key Skills You'll Develop
            </h3>
            <div className="grid gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-purple-700 mb-1">🎯 Conceptual Understanding</h4>
                <p className="text-sm text-gray-600">Connect new concepts to prior knowledge and understand the "why" behind procedures</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-purple-700 mb-1">🔍 Critical Analysis</h4>
                <p className="text-sm text-gray-600">Evaluate solution steps, identify patterns, and justify mathematical reasoning</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-purple-700 mb-1">💭 Metacognition</h4>
                <p className="text-sm text-gray-600">Monitor your own thinking process and recognize when you need help</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-purple-700 mb-1">✍️ Communication</h4>
                <p className="text-sm text-gray-600">Articulate mathematical ideas clearly and precisely in your own words</p>
              </div>
            </div>
          </div>

          {/* How to Use in This App */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border-2 border-purple-200">
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              How It Works in This App
            </h3>
            <ol className="space-y-2 text-gray-700 text-sm">
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">1.</span>
                <span>The AI provides guided hints and does 70% of the problem</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">2.</span>
                <span>You complete the remaining 30% by filling in answers and explanations</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">3.</span>
                <span>You must explain <strong>why</strong> each step works before moving forward</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">4.</span>
                <span>This active engagement builds deeper understanding than passive reading</span>
              </li>
            </ol>
          </div>

          {/* Research Citation */}
          <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-400">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Research Foundation</h4>
            <div className="space-y-2">
              <p className="text-xs text-gray-700 leading-relaxed italic">
                VanLehn, K., Jones, R. M., & Chi, M. T. H. (1992). A model of the self-explanation effect. <em>The Journal of the Learning Sciences, 2</em>(1), 1-59.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                Rittle-Johnson, B. (2006). Promoting transfer: Effects of self-explanation and direct instruction. <em>Child Development, 77</em>(1), 1-15.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                Bisra, K., Liu, Q., Nesbit, J. C., Salimi, F., & Winne, P. H. (2018). Inducing self-explanation: A meta-analysis. <em>Educational Psychology Review, 30</em>(3), 703-725.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Got it! Let's Start Learning
          </button>
        </div>
      </div>
    </div>
  );
}