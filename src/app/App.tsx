import { createActivityLog, recordStepAttempt, recordAIQuery, updateLastAttemptChatMessages } from '../services/activityLogService';
import { DiagnosticPanel } from './components/DiagnosticPanel';
import { APIStatusIndicator } from './components/APIStatusIndicator';
import { CalculationDiagnostic } from './components/CalculationDiagnostic';
import { useState, useEffect } from 'react';
import { StatusBar } from './components/StatusBar';
import { TopActions } from './components/TopActions';
import { MessageInput } from './components/MessageInput';
import { ActionButton } from './components/ActionButton';
import { HomeIndicator } from './components/HomeIndicator';
import { MathBackground } from './components/MathBackground';
import { HomeScreen } from './components/HomeScreen';
import { ScaffoldedSolutionScreen } from './components/ScaffoldedSolutionScreen';
import { ScaffoldedSolutionScreenActive } from './components/ScaffoldedSolutionScreenActive';
import { InteractiveGuidedSolution } from './components/InteractiveGuidedSolution';
import { ArchiveScreen } from './components/ArchiveScreen';
import { InviteFriendScreen } from './components/InviteFriendScreen';
import { CoLearnScreen } from './components/CoLearnScreen';
import { StepFeedbackScreen } from './components/StepFeedbackScreen';
import { BothWrongScreen } from './components/BothWrongScreen';
import { PartiallyCorrectScreen } from './components/PartiallyCorrectScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SelfExplanationModal } from './components/SelfExplanationModal';
import { SelfExplanationLearningScreen } from './components/SelfExplanationLearningScreen';
import { QuestionCorrectionModal } from './components/QuestionCorrectionModal';
import { ActivityLogScreen } from './components/ActivityLogScreen';
import { StudentWorkScreen } from './components/StudentWorkScreen';
import { EditableControls } from './components/EditableControls';
import { IndependentPracticeScreen } from './components/IndependentPracticeScreen';
import { LowFidelityHomeScreen } from './components/LowFidelityHomeScreen';
import { LowFidelityScaffoldedScreen } from './components/LowFidelityScaffoldedScreen';
import { LowFidelityGuidedScreen } from './components/LowFidelityGuidedScreen';
import { LowFidelityArchiveScreen } from './components/LowFidelityArchiveScreen';
import { LowFidelityInviteScreen } from './components/LowFidelityInviteScreen';
import { LowFidelityCoLearnScreen } from './components/LowFidelityCoLearnScreen';
import { LowFidelityFeedbackScreen } from './components/LowFidelityFeedbackScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { PasswordResetDebug } from './components/PasswordResetDebug';
import { SharedExerciseScreen } from './components/SharedExerciseScreen';
import { solveProblem, testConnection } from '../services/aiService';
import { saveActivity } from '../services/archiveService';
import { validateInviteCode } from '../services/inviteService';
import { getSharedQuestion } from '../services/sharedQuestionService';
import { getSessionId } from '../services/sessionService';
import { checkSession, signOut, User } from '../services/authService';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const PENDING_INVITE_CODE_KEY = 'pending_invite_code';
const PENDING_SHARED_QUESTION_ID_KEY = 'pending_shared_question_id';
const PENDING_SHARED_ACTIVITY_ID_KEY = 'pending_shared_activity_id';
const PENDING_SHARED_SESSION_ID_KEY = 'pending_shared_session_id';

interface DesignConfig {
  heading: string;
  placeholder: string;
  button1Label: string;
  button2Label: string;
  iconBgColors: {
    from: string;
    via: string;
    to: string;
  };
  buttonBorderColor: string;
  inputBgColor: string;
}

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [mode, setMode] = useState<'overview' | 'prototype'>('prototype');
  const [fidelity, setFidelity] = useState<'high' | 'low'>('high');
  const [currentScreen, setCurrentScreen] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password' | 'home' | 'scaffolded' | 'scaffolded-active' | 'archive' | 'guided' | 'invite' | 'colearn' | 'feedback-correct' | 'feedback-wrong' | 'feedback-both-wrong' | 'feedback-partial' | 'profile' | 'self-explanation' | 'student-work' | 'practice' | 'shared-exercise'>('login');
  const [screenHistory, setScreenHistory] = useState<Array<'login' | 'signup' | 'forgot-password' | 'reset-password' | 'home' | 'scaffolded' | 'scaffolded-active' | 'archive' | 'guided' | 'invite' | 'colearn' | 'feedback-correct' | 'feedback-wrong' | 'feedback-both-wrong' | 'feedback-partial' | 'profile' | 'self-explanation' | 'student-work' | 'practice' | 'shared-exercise'>>(['login']);
  const [aiData, setAiData] = useState<any>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [showSelfExplanationModal, setShowSelfExplanationModal] = useState<boolean>(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [getCurrentInput, setGetCurrentInput] = useState<(() => string) | null>(null);
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  const [currentActivityLogId, setCurrentActivityLogId] = useState<string | null>(null);
  const [currentLearningThreadId, setCurrentLearningThreadId] = useState<string | null>(null);
  const [currentStepAIQueries, setCurrentStepAIQueries] = useState<number>(0);
  const [stepAttempts, setStepAttempts] = useState<Record<number, number>>({});
  const [currentStepChatMessages, setCurrentStepChatMessages] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);
  // State to preserve user input when navigating back from feedback
  const [savedStepAnswers, setSavedStepAnswers] = useState<Record<number, string>>({});
  const [savedStepExplanations, setSavedStepExplanations] = useState<Record<number, string>>({});
  // Track current step progress in guided solution
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  // Diagnostic panel visibility (show with URL param ?debug=true)
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  // Loading state for solution generation
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
  const [sharePrefillToken, setSharePrefillToken] = useState<string | null>(null);
  const [config, setConfig] = useState<DesignConfig>({
    heading: 'Explore the engineering thinking behind your coursework',
    placeholder: 'Type your question or paste your problem here...',
    button1Label: 'Generate Full Solution',
    button2Label: 'Generate Guided Solution',
    iconBgColors: {
      from: 'purple-500',
      via: 'pink-500',
      to: 'orange-400',
    },
    buttonBorderColor: 'gray-300',
    inputBgColor: '#ffffff',
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    const sharedQuestionId = urlParams.get('s');
    const sharedActivityId = urlParams.get('shared');
    const sharedSessionId = urlParams.get('session');

    if (inviteCode) {
      sessionStorage.setItem(PENDING_INVITE_CODE_KEY, inviteCode);
    }
    if (sharedQuestionId) {
      sessionStorage.setItem(PENDING_SHARED_QUESTION_ID_KEY, sharedQuestionId);
    }
    if (sharedActivityId) {
      sessionStorage.setItem(PENDING_SHARED_ACTIVITY_ID_KEY, sharedActivityId);
    }
    if (sharedSessionId) {
      sessionStorage.setItem(PENDING_SHARED_SESSION_ID_KEY, sharedSessionId);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    // CRITICAL: Check hash FIRST for password recovery before anything else
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAccessToken = hashParams.has('access_token');
    const tokenType = hashParams.get('type');
    
    console.log('🔍 Checking URL on mount...');
    console.log('Hash:', window.location.hash);
    console.log('Has access_token:', hasAccessToken);
    console.log('Token type:', tokenType);
    
    // Check if accessed via shared URL
    const urlParams = new URLSearchParams(window.location.search);
    const isSharedUrl = urlParams.has('shared') || urlParams.has('invite') || urlParams.has('s');
    const isPasswordReset = urlParams.has('reset-password') || window.location.hash.includes('type=recovery') || (hasAccessToken && tokenType === 'recovery');
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';
    
    // Check for debug mode
    if (urlParams.has('debug')) {
      setShowDiagnostics(true);
      console.log('🔧 Debug mode enabled - Diagnostics panel visible');
    }
    
    // PRIORITY #1: Check if user is accessing password reset link
    if (isPasswordReset) {
      console.log('🔑 PASSWORD RESET DETECTED! Showing reset password screen...');
      setCurrentScreen('reset-password');
      setIsCheckingAuth(false);
      return; // EXIT IMMEDIATELY
    }
    
    // If on localhost and NOT a shared URL, bypass authentication completely
    if (isLocalhost && !isSharedUrl) {
      console.log('💻 LOCALHOST - Auto-bypassing authentication for development');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setAuthToken(null);
      setCurrentScreen('home');
      setIsCheckingAuth(false);
      return;
    }
    
    // For shared URLs or production, check authentication normally
    // Add timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      console.warn('⏰ Auth check timeout - defaulting to login');
      setIsAuthenticated(false);
      setCurrentScreen('login');
      setIsCheckingAuth(false);
    }, 5000); // 5 second timeout

    checkSession().then(authState => {
      clearTimeout(authTimeout);
      if (authState.user && authState.token) {
        setIsAuthenticated(true);
        setCurrentUser(authState.user);
        setAuthToken(authState.token);
        setCurrentScreen('home');
        console.log('✅ User authenticated:', authState.user.email);
      } else {
        // If shared URL, REQUIRE authentication
        if (isSharedUrl) {
          console.log('🔒 Shared URL detected - authentication required');
        } else {
          console.log('🌐 Production URL - authentication required');
        }
        setIsAuthenticated(false);
        setCurrentScreen('login');
      }
      setIsCheckingAuth(false);
    }).catch(error => {
      clearTimeout(authTimeout);
      console.error('❌ Error checking session:', error);
      // On error, default to login screen
      setIsAuthenticated(false);
      setCurrentScreen('login');
      setIsCheckingAuth(false);
    });
  }, []);

  // Handle OAuth callback (for Google sign-in) and password reset
  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log('🔍 Checking for OAuth callback or password reset...');
      console.log('Current URL:', window.location.href);
      console.log('Current hash:', window.location.hash);
      
      // Check if this is an OAuth callback or password reset (hash will contain access_token)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hasAccessToken = hashParams.has('access_token');
      const tokenType = hashParams.get('type');
      
      console.log('Has access_token in hash?', hasAccessToken);
      console.log('Token type:', tokenType);
      
      // CRITICAL: If this is password recovery, SKIP this handler completely
      // (First useEffect already handled it and set the screen)
      if (hasAccessToken && tokenType === 'recovery') {
        console.log('🔑 Password recovery - skipping OAuth handler (already handled in first useEffect)');
        return; // Exit early - DON'T touch the screen state
      }
      
      if (hasAccessToken && tokenType !== 'recovery') {
        console.log('🔄 OAuth callback detected, processing...');
        
        // Wait a moment for Supabase to process the session
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check session to get user info
        console.log('📞 Calling checkSession...');
        const authState = await checkSession();
        
        console.log('Auth state from checkSession:', authState);
        
        if (authState.user && authState.token) {
          console.log('✅ OAuth sign-in successful:', authState.user.email);
          setIsAuthenticated(true);
          setCurrentUser(authState.user);
          setAuthToken(authState.token);
          setCurrentScreen('home');
          
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          console.error('❌ OAuth callback failed - no user/token in session');
        }
        
        setIsCheckingAuth(false);
      } else {
        console.log('ℹ️ No OAuth callback detected in URL');
      }
    };
    
    handleOAuthCallback();
  }, []);

  // Test backend connection on mount
  useEffect(() => {
    // Log session information for privacy verification
    const sessionId = getSessionId(currentUser?.id);
    console.log('🔐 SESSION ISOLATION ACTIVE');
    console.log('   Your Session ID:', sessionId);
    console.log('   🔒 All your activities, chat logs, and data are isolated by this session ID');
    console.log('   🌐 Other users with different session IDs cannot see your data');
    console.log('   📱 Opening in a new browser/incognito will create a new isolated session');
    
    testConnection().then(connected => {
      console.log('Backend connection test:', connected ? 'SUCCESS' : 'FAILED');
    });
  }, [currentUser]);

  // Check for invite code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    
    if (inviteCode) {
      console.log('📨 Invite code detected:', inviteCode);
      
      // Validate the invite code
      validateInviteCode(inviteCode).then(result => {
        if (result.valid) {
          console.log('✅ Valid invite code! Welcome!');
          // Switch to prototype mode and show home screen
          setMode('prototype');
          setCurrentScreen('home');
          
          // Optional: Show a welcome toast/notification
          // For now, just log it
        } else {
          console.log('❌ Invalid invite code');
        }
      });
      
      // Clean up the URL (remove the invite parameter)
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Check for shared activity link in URL
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const urlParams = new URLSearchParams(window.location.search);
    const sharedActivityId = urlParams.get('shared');
    const sharedSessionId = urlParams.get('session');
    
    if (sharedActivityId) {
      console.log('🔗 Shared activity detected:', sharedActivityId);
      console.log('📌 Session ID:', sharedSessionId || 'none');
      
      // Import the shared activity to the current user's archive
      import('../services/activityLogService').then(({ markActivityAsShared }) => {
        if (markActivityAsShared) {
          markActivityAsShared(sharedActivityId, sharedSessionId || undefined).then(() => {
            console.log('✅ Shared activity added to your archive!');
            
            // Navigate to archive to show the shared activity
            setMode('prototype');
            setCurrentScreen('archive');
            
            // Show a notification (optional - using alert for now)
            setTimeout(() => {
              alert('📚 Shared question added to your archive! Look for the group icon 👥');
            }, 500);
          }).catch((error: any) => {
            console.error('❌ Failed to add shared activity:', error);
          });
        }
      });
      
      // Clean up the URL (remove the shared parameter)
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isAuthenticated, currentUser]);

  // Check for shared question link (s parameter)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedQuestionId = urlParams.get('s');
    
    if (sharedQuestionId) {
      console.log('🔗 Shared question detected:', sharedQuestionId);
      
      // Retrieve the shared question from localStorage
      const storedQuestion = localStorage.getItem(`pending_share_${sharedQuestionId}`);
      
      if (storedQuestion) {
        try {
          const sharedQuestion = JSON.parse(storedQuestion);
          
          // Get or create shared questions array for this user
          const sessionId = getSessionId();
          const stored = localStorage.getItem(`shared_questions_${sessionId}`) || '[]';
          const sharedQuestions = JSON.parse(stored);
          
          // Check if question already added
          const alreadyExists = sharedQuestions.some((q: any) => q.id === sharedQuestion.id);
          
          if (!alreadyExists) {
            // Add to shared questions
            sharedQuestions.push(sharedQuestion);
            localStorage.setItem(`shared_questions_${sessionId}`, JSON.stringify(sharedQuestions));
            
            console.log('✅ Shared question added to your exercises!');
            
            // Navigate to shared exercise screen
            setTimeout(() => {
              setCurrentScreen('shared-exercise');
              alert('📚 New shared question added! Check your Shared Exercises.');
            }, 500);
          } else {
            console.log('ℹ️ Question already in your shared exercises');
          }
        } catch (error) {
          console.error('❌ Error processing shared question:', error);
        }
      } else {
        console.warn('⚠️ Shared question not found in localStorage');
      }
      
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const sharedQuestionId = sessionStorage.getItem(PENDING_SHARED_QUESTION_ID_KEY);
    if (!sharedQuestionId) return;

    getSharedQuestion(sharedQuestionId)
      .then(async (sharedQuestion) => {
        if (!sharedQuestion) {
          return;
        }

        if (sharedQuestion.activityLogId) {
          const { markActivityAsShared } = await import('../services/activityLogService');
          await markActivityAsShared(sharedQuestion.activityLogId, sharedQuestion.sharedSessionId || undefined);
        }

        setUserQuestion(sharedQuestion.question || '');
        setUploadedImageUrl(sharedQuestion.imageUrl || null);
        setSharePrefillToken(sharedQuestion.id);
        setMode('prototype');
        setCurrentScreen('home');
        sessionStorage.removeItem(PENDING_SHARED_QUESTION_ID_KEY);
      })
      .catch((error) => {
        console.error('Error processing shared question after login:', error);
      });
  }, [currentUser, isAuthenticated]);

  // Handle question correction submission
  const handleQuestionCorrection = async (correctedQuestion: string, file?: File) => {
    console.log('Question correction received:', correctedQuestion, file);
    
    // Update the question
    setUserQuestion(correctedQuestion);
    
    // TODO: If file is provided, upload it to backend
    if (file) {
      console.log('File to upload:', file.name, file.size);
      // In a real implementation, you would upload the file here
    }
    
    // Regenerate the solution with the corrected question
    try {
      // ✅ Pass the uploaded image URL when regenerating
      const aiResponse = await solveProblem(correctedQuestion, uploadedImageUrl || undefined, 'openai');
      setAiData(aiResponse);
      console.log('Solution regenerated successfully');
    } catch (error) {
      console.error('Failed to regenerate solution:', error);
      setAiData({
        solution: `Unable to generate solution. Please check your connection.`,
        strategy: 'Try again or check if the backend is configured.',
        steps: []
      });
    }
  };

  // Save activity to archive when user starts learning
  const handleStartLearning = async () => {
    if (userQuestion && aiData) {
      try {
        // Save to activities
        const activityId = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9063c65e/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Id': getSessionId(currentUser?.id)
          },
          body: JSON.stringify({
            question: userQuestion,
            status: 'In Progress',
            aiData: aiData,
            completedSteps: 0,
            totalSteps: aiData?.steps?.length || 0
          })
        }).then(res => res.json()).then(data => data.id);
        setCurrentActivityId(activityId);
        console.log('✅ Activity saved to archive, ID:', activityId);
        
        // Create activity log for tracking attempts
        console.log('📝 Creating activity log with:', {
          activityId,
          question: userQuestion,
          totalSteps: aiData?.steps?.length || 0
        });
        
        // For guided solutions, the log ID itself becomes the learning thread ID
        const logId = await createActivityLog(
          activityId,
          userQuestion,
          aiData?.steps?.length || 0
        );
        
        setCurrentActivityLogId(logId);
        setCurrentLearningThreadId(logId); // This guided solution starts a new learning thread
        console.log('✅ Activity log created successfully!');
        console.log('   Log ID:', logId);
        console.log('   State will be updated to:', logId);
        
        // Verify the state was set
        setTimeout(() => {
          console.log('🔍 Verifying currentActivityLogId state after 100ms...');
        }, 100);
        
        // Reset step attempts and AI queries
        setStepAttempts({});
        setCurrentStepAIQueries(0);
      } catch (error) {
        console.error('❌ Failed to save activity or create log:', error);
        console.error('   Error details:', error.message);
        console.error('   Stack:', error.stack);
      }
    }
    setCurrentScreen('guided');
  };

  // Navigation helper function with history tracking
  const navigateToScreen = (screen: typeof currentScreen) => {
    setScreenHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  // Navigate back to previous screen
  const navigateBack = () => {
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      const previousScreen = newHistory[newHistory.length - 1];
      newHistory.pop();
      setScreenHistory(newHistory);
      setCurrentScreen(previousScreen);
    } else {
      // Fallback to home if no history
      setCurrentScreen('home');
    }
  };

  // Prototype Player Mode - Full screen, focused experience
  if (mode === 'prototype') {
    // Show loading while checking auth
    if (isCheckingAuth) {
      return (
        <div className="size-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading app...</p>
            <p className="text-gray-400 text-sm mt-2">Checking authentication...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="size-full bg-white flex flex-col overflow-hidden">
            {/* Calculation Diagnostic Test - only shown with ?debug=true URL param */}
            {showDiagnostics && <CalculationDiagnostic />}
            
            {/* Diagnostic Panel - only shown with ?debug=true URL param */}
            {showDiagnostics && <DiagnosticPanel />}
            
            {/* API Status Indicator - only shown with ?debug=true URL param */}
            {showDiagnostics && <APIStatusIndicator />}
            
            {currentScreen === 'login' ? (
              <LoginScreen
                onLoginSuccess={(user, token) => {
                  setCurrentUser(user);
                  setAuthToken(token);
                  setIsAuthenticated(true);
                  setCurrentScreen('home');
                }}
                onSignUpClick={() => setCurrentScreen('signup')}
                onGuestContinue={() => {
                  setIsAuthenticated(false);
                  setCurrentScreen('home');
                }}
                onForgotPasswordClick={() => setCurrentScreen('forgot-password')}
                onDevBypass={() => {
                  // Developer bypass - only available on localhost
                  console.log('🔓 Developer bypass activated');
                  setIsAuthenticated(false);
                  setCurrentUser(null);
                  setAuthToken(null);
                  setCurrentScreen('home');
                }}
              />
            ) : currentScreen === 'signup' ? (
              <SignUpScreen
                onSignUpSuccess={() => {
                  // After signup, redirect to login
                  setCurrentScreen('login');
                }}
                onLoginClick={() => setCurrentScreen('login')}
                onGuestContinue={() => {
                  setIsAuthenticated(false);
                  setCurrentScreen('home');
                }}
              />
            ) : currentScreen === 'forgot-password' ? (
              <ForgotPasswordScreen
                onBackToLogin={() => setCurrentScreen('login')}
              />
            ) : currentScreen === 'reset-password' ? (
              <ResetPasswordScreen
                onResetSuccess={() => setCurrentScreen('login')}
                onBackToLogin={() => setCurrentScreen('login')}
              />
            ) : currentScreen === 'home' ? (
              <HomeScreen
                config={config}
                onArchiveClick={() => setCurrentScreen('archive')}
                onInviteClick={() => setCurrentScreen('invite')}
                onProfileClick={() => setCurrentScreen('profile')}
                onSharedExerciseClick={() => navigateToScreen('shared-exercise')}
                currentUserName={currentUser?.email || 'You'}
                onGenerateSolution={async () => {
                  // Get current input from MessageInput
                  const question = getCurrentInput?.() || '';
                  
                  console.log('🚀 BUTTON CLICKED - Generate Guided Solution');
                  console.log('📝 Question:', question.trim());
                  console.log('📷 Image:', uploadedImageUrl ? 'YES' : 'NO');
                  
                  if (question.trim()) {
                    setUserQuestion(question.trim());
                  }
                  
                  // Show loading state
                  setIsGeneratingSolution(true);
                  
                  // Reset step progress when generating new solution
                  setCurrentStepIndex(0);
                  setCompletedSteps(new Set());
                  
                  // Call AI service to get problem-specific solution
                  try {
                    console.log('🤖 Calling solveProblem API...');
                    console.log('⏱️  Processing started at:', new Date().toLocaleTimeString());
                    const startTime = Date.now();
                    const aiResponse = await solveProblem(question.trim() || 'Please solve this problem from the image', uploadedImageUrl || undefined, 'openai');
                    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                    console.log(`✅ AI Response received in ${duration}s`);
                    console.log('📊 Steps count:', aiResponse?.steps?.length || 0);
                    setAiData(aiResponse);
                    console.log('✅ AI data set in state');
                  } catch (error) {
                    console.error('❌ Failed to generate solution:', error);
                    alert(`Failed to generate solution: ${error.message || 'Unknown error'}`);
                    // Fallback to basic demo if there's an error
                    setAiData({
                      solution: `Unable to generate solution. Please check your connection.`,
                      strategy: 'Try again or check if the backend is configured.',
                      steps: []
                    });
                  } finally {
                    setIsGeneratingSolution(false);
                  }
                  
                  console.log('🔀 Navigating to scaffolded screen...');
                  setCurrentScreen('scaffolded');
                }}
                onQuestionSubmit={(question, imageUrl) => {
                  if (question) setUserQuestion(question);
                  if (imageUrl) setUploadedImageUrl(imageUrl);
                }}
                onGetCurrentInput={(getter) => setGetCurrentInput(() => getter)}
                isGeneratingSolution={isGeneratingSolution}
                getCurrentInput={getCurrentInput}
                uploadedImageUrl={uploadedImageUrl}
                prefilledQuestion={userQuestion}
                prefillToken={sharePrefillToken}
              />
            ) : currentScreen === 'scaffolded' ? (
              <>
                <StatusBar />
                <ScaffoldedSolutionScreen
                  onBack={navigateBack}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => navigateToScreen('archive')}
                  onInviteClick={() => navigateToScreen('invite')}
                  onStartLearning={handleStartLearning}
                  onCorrectQuestion={() => setShowCorrectionModal(true)}
                  onMarkAsCorrect={() => navigateToScreen('scaffolded-active')}
                  aiData={aiData}
                  userQuestion={userQuestion}
                  uploadedImageUrl={uploadedImageUrl}
                />
                
                {/* Question Correction Modal */}
                <QuestionCorrectionModal
                  isOpen={showCorrectionModal}
                  onClose={() => setShowCorrectionModal(false)}
                  currentQuestion={userQuestion}
                  onSubmitCorrection={handleQuestionCorrection}
                />
                
                <HomeIndicator />
              </>
            ) : currentScreen === 'scaffolded-active' ? (
              <>
                <StatusBar />
                <ScaffoldedSolutionScreenActive
                  onBack={navigateBack}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => navigateToScreen('archive')}
                  onInviteClick={() => navigateToScreen('invite')}
                  onStartLearning={handleStartLearning}
                  aiData={aiData}
                  userQuestion={userQuestion}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'guided' ? (
              <>
                <StatusBar />
                <InteractiveGuidedSolution
                  onBack={navigateBack}
                  onCoLearnClick={() => navigateToScreen('colearn')}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => navigateToScreen('archive')}
                  onInviteClick={() => navigateToScreen('invite')}
                  onPracticeClick={() => navigateToScreen('practice')}
                  currentStepChatMessages={currentStepChatMessages}
                  savedStepAnswers={savedStepAnswers}
                  savedStepExplanations={savedStepExplanations}
                  currentStepIndex={currentStepIndex}
                  completedSteps={completedSteps}
                  onStepIndexChange={setCurrentStepIndex}
                  onCompletedStepsChange={setCompletedSteps}
                  onInputChange={(stepNumber, answer, explanation) => {
                    setSavedStepAnswers(prev => ({ ...prev, [stepNumber]: answer }));
                    setSavedStepExplanations(prev => ({ ...prev, [stepNumber]: explanation }));
                  }}
                  activityLogId={currentActivityLogId}
                  onStepAttempt={(stepNumber, userAnswer, userExplanation, answerCorrect, explanationCorrect, chatMessages, answerImageUrl, explanationImageUrl) => {
                    // Record step attempt in activity log with chat messages AND image URLs
                    if (currentActivityLogId) {
                      // Add timestamps to chat messages
                      const timestampedMessages = (chatMessages || []).map(msg => ({
                        ...msg,
                        timestamp: new Date().toISOString()
                      }));
                      
                      recordStepAttempt(
                        currentActivityLogId,
                        stepNumber,
                        userAnswer,
                        userExplanation,
                        answerCorrect,
                        explanationCorrect,
                        currentStepAIQueries,
                        timestampedMessages,
                        answerImageUrl,
                        explanationImageUrl
                      ).catch(error => {
                        console.error('Failed to record step attempt:', error);
                      });
                    }
                    
                    // Reset chat messages and AI queries for next attempt
                    setCurrentStepChatMessages([]);
                    setCurrentStepAIQueries(0);
                  }}
                  onNavigateToFeedback={(feedbackType, data) => {
                    // Track step attempts
                    const stepNum = data.stepNumber;
                    const currentAttempts = stepAttempts[stepNum] || 0;
                    const newAttempts = currentAttempts + 1;
                    
                    setStepAttempts(prev => ({
                      ...prev,
                      [stepNum]: newAttempts
                    }));
                    
                    // Add attempt count and step data to feedback data
                    setFeedbackData({
                      ...data,
                      attemptCount: newAttempts,
                      // Pass the full step data including correct answer for 3rd attempt
                      stepData: aiData?.steps?.[stepNum - 1],
                      // Pass original question for AI context
                      originalQuestion: userQuestion
                    });
                    
                    console.log(`Step ${stepNum} attempt ${newAttempts}/3`);
                    
                    if (feedbackType === 'both-wrong') {
                      setCurrentScreen('feedback-both-wrong');
                    } else if (feedbackType === 'partial') {
                      setCurrentScreen('feedback-partial');
                    } else if (feedbackType === 'correct') {
                      setCurrentScreen('feedback-correct');
                      // Reset attempts for this step on success
                      setStepAttempts(prev => ({
                        ...prev,
                        [stepNum]: 0
                      }));
                    }
                  }}
                  aiData={aiData}
                  userQuestion={userQuestion}
                  uploadedImageUrl={uploadedImageUrl}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'archive' ? (
              <>
                <StatusBar />
                <ArchiveScreen
                  onBack={navigateBack}
                  onHomeClick={() => setCurrentScreen('home')}
                  onInviteClick={() => navigateToScreen('invite')}
                  onStudentWorkClick={() => navigateToScreen('student-work')}
                  currentUserName={currentUser?.email || 'You'}
                  onActivityClick={(activity) => {
                    // Load the archived activity back into the guided solution screen
                    console.log('📂 Loading archived activity:', activity);
                    setUserQuestion(activity.question);
                    setAiData(activity.aiData);
                    setCurrentActivityId(activity.id);
                    // Navigate to guided solution screen
                    navigateToScreen('guided');
                  }}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'invite' ? (
              <>
                <StatusBar />
                <InviteFriendScreen
                  onBack={navigateBack}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => navigateToScreen('archive')}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'colearn' ? (
              <>
                <StatusBar />
                <CoLearnScreen
                  onBack={navigateBack}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => navigateToScreen('archive')}
                  onInviteClick={() => navigateToScreen('invite')}
                  problemContext={userQuestion}
                  activityLogId={currentActivityLogId || undefined}
                  currentUserName="You"
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'feedback-correct' ? (
              <>
                <StatusBar />
                <StepFeedbackScreen
                  answerCorrect={true}
                  explanationCorrect={true}
                  feedbackData={feedbackData}
                  onBack={navigateBack}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => navigateToScreen('archive')}
                  onInviteClick={() => navigateToScreen('invite')}
                  onCoLearnClick={() => navigateToScreen('colearn')}
                  onContinueToNextStep={() => setCurrentScreen('guided')}
                  onAIQueryUsed={() => {
                    setCurrentStepAIQueries(prev => prev + 1);
                    // Record AI query in activity log
                    if (currentActivityLogId && feedbackData?.stepNumber) {
                      recordAIQuery(currentActivityLogId, feedbackData.stepNumber).catch(error => {
                        console.error('Failed to record AI query:', error);
                      });
                    }
                    console.log('AI query used, total:', currentStepAIQueries + 1);
                  }}
                  onChatMessagesChange={(messages) => {
                    setCurrentStepChatMessages(messages);
                  }}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'feedback-wrong' ? (
              <>
                <StatusBar />
                <StepFeedbackScreen
                  answerCorrect={false}
                  explanationCorrect={false}
                  feedbackData={feedbackData}
                  onBack={() => setCurrentScreen('home')}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => setCurrentScreen('archive')}
                  onInviteClick={() => setCurrentScreen('invite')}
                  onCoLearnClick={() => setCurrentScreen('colearn')}
                  onAIQueryUsed={() => {
                    setCurrentStepAIQueries(prev => prev + 1);
                    // Record AI query in activity log
                    if (currentActivityLogId && feedbackData?.stepNumber) {
                      recordAIQuery(currentActivityLogId, feedbackData.stepNumber).catch(error => {
                        console.error('Failed to record AI query:', error);
                      });
                    }
                    console.log('AI query used, total:', currentStepAIQueries + 1);
                  }}
                  onChatMessagesChange={(messages) => {
                    setCurrentStepChatMessages(messages);
                  }}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'feedback-both-wrong' ? (
              <>
                <StatusBar />
                <BothWrongScreen
                  onBack={() => setCurrentScreen('home')}
                  onTryAgain={(chatMessages) => {
                    console.log('🔍 BothWrongScreen onTryAgain called with chat messages:', chatMessages);
                    console.log('🔍 Chat messages type:', typeof chatMessages);
                    console.log('🔍 Chat messages is array?', Array.isArray(chatMessages));
                    console.log('🔍 Chat messages length:', chatMessages?.length);
                    console.log('🔍 Current activity log ID:', currentActivityLogId);
                    console.log('🔍 Feedback step number:', feedbackData?.stepNumber);
                    
                    // Update the last attempt with chat messages from feedback screen
                    if (chatMessages && chatMessages.length > 0 && currentActivityLogId && feedbackData?.stepNumber) {
                      const timestampedMessages = chatMessages.map(msg => ({
                        ...msg,
                        timestamp: new Date().toISOString()
                      }));
                      console.log('📝 Updating last attempt with', timestampedMessages.length, 'messages for step', feedbackData.stepNumber);
                      console.log('📝 Messages to send:', JSON.stringify(timestampedMessages, null, 2));
                      updateLastAttemptChatMessages(
                        currentActivityLogId,
                        feedbackData.stepNumber,
                        timestampedMessages
                      ).then(() => {
                        console.log('✅ Successfully updated chat messages');
                      }).catch(error => {
                        console.error('Failed to update chat messages:', error);
                      });
                    }
                    setCurrentScreen('guided');
                  }}
                  stepNumber={feedbackData?.stepNumber}
                  hint={feedbackData?.hint}
                  userAnswer={feedbackData?.userAnswer}
                  userExplanation={feedbackData?.userExplanation}
                  onAIQueryUsed={() => {
                    setCurrentStepAIQueries(prev => prev + 1);
                    // Record AI query in activity log
                    if (currentActivityLogId && feedbackData?.stepNumber) {
                      recordAIQuery(currentActivityLogId, feedbackData.stepNumber).catch(error => {
                        console.error('Failed to record AI query:', error);
                      });
                    }
                    console.log('AI query used, total:', currentStepAIQueries + 1);
                  }}
                  onChatMessagesChange={(messages) => {
                    console.log('💬 App.tsx: Received chat messages update from BothWrongScreen:', messages);
                    setCurrentStepChatMessages(messages);
                  }}
                  attemptCount={feedbackData?.attemptCount}
                  stepData={feedbackData?.stepData}
                  originalQuestion={feedbackData?.originalQuestion}
                  answerImageUrl={feedbackData?.answerImageUrl}
                  explanationImageUrl={feedbackData?.explanationImageUrl}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'feedback-partial' ? (
              <>
                <StatusBar />
                <PartiallyCorrectScreen
                  onBack={() => setCurrentScreen('home')}
                  onTryAgain={(chatMessages) => {
                    // Update the last attempt with chat messages from feedback screen
                    if (chatMessages && chatMessages.length > 0 && currentActivityLogId && feedbackData?.stepNumber) {
                      const timestampedMessages = chatMessages.map(msg => ({
                        ...msg,
                        timestamp: new Date().toISOString()
                      }));
                      updateLastAttemptChatMessages(
                        currentActivityLogId,
                        feedbackData.stepNumber,
                        timestampedMessages
                      ).catch(error => {
                        console.error('Failed to update chat messages:', error);
                      });
                    }
                    setCurrentScreen('guided');
                  }}
                  stepNumber={feedbackData?.stepNumber}
                  hint={feedbackData?.hint}
                  userAnswer={feedbackData?.userAnswer}
                  userExplanation={feedbackData?.userExplanation}
                  answerCorrect={feedbackData?.answerCorrect}
                  explanationCorrect={feedbackData?.explanationCorrect}
                  attemptCount={feedbackData?.attemptCount}
                  stepData={feedbackData?.stepData}
                  onAIQueryUsed={() => {
                    setCurrentStepAIQueries(prev => prev + 1);
                    // Record AI query in activity log
                    if (currentActivityLogId && feedbackData?.stepNumber) {
                      recordAIQuery(currentActivityLogId, feedbackData.stepNumber).catch(error => {
                        console.error('Failed to record AI query:', error);
                      });
                    }
                    console.log('AI query used, total:', currentStepAIQueries + 1);
                  }}
                  onChatMessagesChange={(messages) => {
                    console.log('💬 App.tsx: Received chat messages update from PartiallyCorrectScreen:', messages);
                    setCurrentStepChatMessages(messages);
                  }}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'profile' ? (
              <>
                <StatusBar />
                <ProfileScreen
                  onBack={() => setCurrentScreen('home')}
                  onLogout={async () => {
                    await signOut();
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                    setAuthToken(null);
                    setCurrentScreen('login');
                  }}
                  user={currentUser}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'self-explanation' ? (
              <>
                <StatusBar />
                <SelfExplanationLearningScreen
                  onBack={() => setCurrentScreen('home')}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'practice' ? (
              <>
                <StatusBar />
                <IndependentPracticeScreen
                  onBack={navigateBack}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => navigateToScreen('archive')}
                  onInviteClick={() => navigateToScreen('invite')}
                  originalQuestion={userQuestion}
                  originalAIData={aiData}
                  learningThreadId={currentLearningThreadId || undefined}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'shared-exercise' ? (
              <>
                <StatusBar />
                <SharedExerciseScreen
                  onBack={navigateBack}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => navigateToScreen('archive')}
                  onStartQuestion={(question, imageUrl) => {
                    setUserQuestion(question);
                    setUploadedImageUrl(imageUrl || null);
                    setCurrentScreen('home');
                  }}
                  sessionId={getSessionId()}
                />
                <HomeIndicator />
              </>
            ) : currentScreen === 'student-work' ? (
              <>
                <StatusBar />
                <StudentWorkScreen
                  onBack={() => setCurrentScreen('archive')}
                  onHomeClick={() => setCurrentScreen('home')}
                />
                <HomeIndicator />
              </>
            ) : (
              <>
                <StatusBar />
                <StepFeedbackScreen
                  answerCorrect={false}
                  explanationCorrect={false}
                  onBack={() => setCurrentScreen('home')}
                  onHomeClick={() => setCurrentScreen('home')}
                  onArchiveClick={() => setCurrentScreen('archive')}
                  onInviteClick={() => setCurrentScreen('invite')}
                  onCoLearnClick={() => setCurrentScreen('colearn')}
                />
                <HomeIndicator />
              </>
            )}
      </div>
    );
  }

  // Design/Overview Mode
  return (
    <div className="size-full overflow-auto bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <EditableControls
        onConfigChange={setConfig}
        onPlayPrototype={() => {
          setMode('prototype');
          setCurrentScreen('guided');
        }}
        isPrototypeMode={mode === 'prototype'}
      />

      {/* Fidelity Toggle */}
      <div className="fixed top-4 left-4 z-[100] flex gap-2 bg-white p-2 rounded-xl shadow-xl">
        <button
          onClick={() => setFidelity('high')}
          className={`px-4 py-2 rounded-lg shadow-lg transition-colors font-medium ${
            fidelity === 'high'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          ✨ High Fidelity
        </button>
        <button
          onClick={() => setFidelity('low')}
          className={`px-4 py-2 rounded-lg shadow-lg transition-colors font-medium ${
            fidelity === 'low'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          📝 Low Fidelity
        </button>
      </div>

      {/* Overview - All Screens */}
      <div className="flex flex-col gap-12 items-center min-h-full py-8">
        {fidelity === 'high' ? (
          <>
            {/* High Fidelity - Home Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Home Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <TopActions />

                {/* Main content area */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 bg-gray-100 relative">
                  <MathBackground />
                  <div className="relative z-10 w-full flex flex-col items-center">
                    <h2 className="text-[28px] text-gray-900 mb-8">
                      {config.heading}
                    </h2>

                    <MessageInput
                      placeholder={config.placeholder}
                      bgColor={config.inputBgColor}
                      onNavigate={() => setCurrentScreen('scaffolded')}
                    />

                    {/* Action buttons */}
                    <div className="w-full flex flex-col gap-3">
                      <ActionButton label={config.button2Label} onClick={() => {}} />
                    </div>
                  </div>
                </div>

                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Guided Solution Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Guided Solution Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <InteractiveGuidedSolution
                  onBack={() => {}}
                  onHomeClick={() => {}}
                  onCoLearnClick={() => {}}
                  onArchiveClick={() => {}}
                  onInviteClick={() => {}}
                  onNavigateToFeedback={() => {}}
                />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Solution Strategy Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Solution Strategy Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <ScaffoldedSolutionScreen onBack={() => {}} onHomeClick={() => {}} />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Solution Strategy Screen (Active) */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Solution Strategy Screen (Active)</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <ScaffoldedSolutionScreenActive onBack={() => {}} onHomeClick={() => {}} onStartLearning={() => {}} />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Archive Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Archive Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <ArchiveScreen onBack={() => {}} onHomeClick={() => {}} />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Invite Friend Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Invite Friend Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <InviteFriendScreen onBack={() => {}} onHomeClick={() => {}} />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Co-Learn Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Co-Learn Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <CoLearnScreen onBack={() => {}} onHomeClick={() => {}} />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Profile Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Profile Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <ProfileScreen onBack={() => {}} />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Feedback (Both Correct) Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Feedback - Both Correct</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <StepFeedbackScreen answerCorrect={true} explanationCorrect={true} onBack={() => {}} onHomeClick={() => {}} />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Feedback (Answer Correct) Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Feedback - Answer Correct</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <StepFeedbackScreen answerCorrect={true} explanationCorrect={false} onBack={() => {}} onHomeClick={() => {}} />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Feedback (Explanation Correct) Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Feedback - Explanation Correct</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <StepFeedbackScreen answerCorrect={false} explanationCorrect={true} onBack={() => {}} onHomeClick={() => {}} />
                <HomeIndicator />
              </div>
            </div>

            {/* High Fidelity - Feedback (Both Wrong) Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Feedback - Both Wrong</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <StatusBar />
                <StepFeedbackScreen answerCorrect={false} explanationCorrect={false} onBack={() => {}} onHomeClick={() => {}} />
                <HomeIndicator />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Low Fidelity - Home Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Home Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-[50px] flex items-center justify-center px-8 pt-2 border-b-2 border-gray-300">
                  <span className="text-[12px] text-gray-600">STATUS BAR</span>
                </div>
                <LowFidelityHomeScreen
                  heading={config.heading}
                  placeholder={config.placeholder}
                  button1Label={config.button1Label}
                  button2Label={config.button2Label}
                  onButton2Click={() => {}}
                />
                <div className="h-[34px] flex items-center justify-center pb-2 border-t-2 border-gray-300">
                  <div className="w-[100px] h-[4px] bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Low Fidelity - Solution Strategy Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Solution Strategy Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-[50px] flex items-center justify-center px-8 pt-2 border-b-2 border-gray-300">
                  <span className="text-[12px] text-gray-600">STATUS BAR</span>
                </div>
                <LowFidelityScaffoldedScreen onBack={() => {}} />
                <div className="h-[34px] flex items-center justify-center pb-2 border-t-2 border-gray-300">
                  <div className="w-[100px] h-[4px] bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Low Fidelity - Guided Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Guided Solution Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-[50px] flex items-center justify-center px-8 pt-2 border-b-2 border-gray-300">
                  <span className="text-[12px] text-gray-600">STATUS BAR</span>
                </div>
                <LowFidelityGuidedScreen onBack={() => {}} />
                <div className="h-[34px] flex items-center justify-center pb-2 border-t-2 border-gray-300">
                  <div className="w-[100px] h-[4px] bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Low Fidelity - Archive Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Archive Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-[50px] flex items-center justify-center px-8 pt-2 border-b-2 border-gray-300">
                  <span className="text-[12px] text-gray-600">STATUS BAR</span>
                </div>
                <LowFidelityArchiveScreen onBack={() => {}} />
                <div className="h-[34px] flex items-center justify-center pb-2 border-t-2 border-gray-300">
                  <div className="w-[100px] h-[4px] bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Low Fidelity - Invite Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Invite Friend Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-[50px] flex items-center justify-center px-8 pt-2 border-b-2 border-gray-300">
                  <span className="text-[12px] text-gray-600">STATUS BAR</span>
                </div>
                <LowFidelityInviteScreen onBack={() => {}} />
                <div className="h-[34px] flex items-center justify-center pb-2 border-t-2 border-gray-300">
                  <div className="w-[100px] h-[4px] bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Low Fidelity - Co-Learn Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Co-Learn Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-[50px] flex items-center justify-center px-8 pt-2 border-b-2 border-gray-300">
                  <span className="text-[12px] text-gray-600">STATUS BAR</span>
                </div>
                <LowFidelityCoLearnScreen onBack={() => {}} />
                <div className="h-[34px] flex items-center justify-center pb-2 border-t-2 border-gray-300">
                  <div className="w-[100px] h-[4px] bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Low Fidelity - Feedback Screen */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Feedback Screen</h3>
              <div className="w-[600px] h-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-[50px] flex items-center justify-center px-8 pt-2 border-b-2 border-gray-300">
                  <span className="text-[12px] text-gray-600">STATUS BAR</span>
                </div>
                <LowFidelityFeedbackScreen onBack={() => {}} />
                <div className="h-[34px] flex items-center justify-center pb-2 border-t-2 border-gray-300">
                  <div className="w-[100px] h-[4px] bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Password Reset Debug Component - Remove this after testing */}
      <PasswordResetDebug />
    </div>
  );
}
