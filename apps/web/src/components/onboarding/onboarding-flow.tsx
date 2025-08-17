'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Heart, 
  Shield, 
  PenTool, 
  Search, 
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<{ 
    onNext: () => void; 
    onPrev: () => void;
    userPreferences?: any;
    setUserPreferences?: any;
  }>
}

export function OnboardingFlow() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [userPreferences, setUserPreferences] = useState({
    shareForResearch: false,
    allowModelTraining: false,
    receiveStudyInvites: false,
    enableNotifications: true,
    preferredPrivacy: 'PRIVATE' as const,
  })

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to LLHE',
      description: 'Let\'s get you started on your journey',
      component: WelcomeStep,
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      description: 'Configure how your data is used',
      component: PrivacyStep,
    },
    {
      id: 'first-story',
      title: 'Your First Story',
      description: 'Create your first experience fragment',
      component: FirstStoryStep,
    },
    {
      id: 'features',
      title: 'Explore Features',
      description: 'Discover what you can do with LLHE',
      component: FeaturesStep,
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'You\'re ready to start your journey',
      component: CompleteStep,
    },
  ]

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Save preferences and complete onboarding
      completeOnboarding()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    try {
      // Save user preferences
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPreferences),
      })

      // Mark onboarding as complete
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      // Redirect to main app
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  const CurrentStepComponent = currentStepData.component

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-purple-600 mr-2" />
            <span className="text-2xl font-bold">LLHE</span>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <p className="text-gray-600">{currentStepData.description}</p>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent 
            onNext={handleNext} 
            onPrev={handlePrev}
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">👋</div>
      <div className="space-y-4">
        <p className="text-lg text-gray-700">
          Welcome to the Living Library of Human Experiences! We're excited to help you 
          capture, connect, and explore your life's moments.
        </p>
        <p className="text-gray-600">
          This quick setup will help you customize your experience and understand 
          what makes LLHE special.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 my-8">
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold">Privacy First</h3>
          <p className="text-sm text-gray-600">Your data stays private</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Search className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold">AI Insights</h3>
          <p className="text-sm text-gray-600">Discover connections</p>
        </div>
      </div>
      <Button onClick={onNext} className="w-full">
        Let's Get Started <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

function PrivacyStep({ 
  onNext, 
  onPrev, 
  userPreferences, 
  setUserPreferences 
}: { 
  onNext: () => void
  onPrev: () => void
  userPreferences?: any
  setUserPreferences?: any
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-purple-600 mx-auto mb-2" />
        <p className="text-gray-700">
          Your privacy is our top priority. Configure these settings to match your comfort level.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <h3 className="font-semibold">Share for Research</h3>
            <p className="text-sm text-gray-600">
              Allow anonymized insights to contribute to human experience research
            </p>
          </div>
          <Switch
            checked={userPreferences.shareForResearch}
            onCheckedChange={(checked: boolean) =>
              setUserPreferences({ ...userPreferences, shareForResearch: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <h3 className="font-semibold">AI Model Training</h3>
            <p className="text-sm text-gray-600">
              Help improve AI models with your anonymized data
            </p>
          </div>
          <Switch
            checked={userPreferences.allowModelTraining}
            onCheckedChange={(checked: boolean) =>
              setUserPreferences({ ...userPreferences, allowModelTraining: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <h3 className="font-semibold">Study Invitations</h3>
            <p className="text-sm text-gray-600">
              Receive invitations to participate in relevant research studies
            </p>
          </div>
          <Switch
            checked={userPreferences.receiveStudyInvites}
            onCheckedChange={(checked: boolean) =>
              setUserPreferences({ ...userPreferences, receiveStudyInvites: checked })
            }
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Remember:</strong> You can change these settings anytime in your account preferences.
        </p>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function FirstStoryStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <PenTool className="h-12 w-12 text-green-600 mx-auto mb-2" />
        <p className="text-gray-700">
          Let's create your first experience fragment! This could be anything - a recent memory, 
          a meaningful moment, or just what you did today.
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-4">Quick Tutorial: What makes a great fragment?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <strong>Be specific:</strong> Include details about when, where, and what happened
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <strong>Include emotions:</strong> How did you feel? What was the mood?
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <strong>Add context:</strong> Why was this moment significant to you?
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={() => window.open('/create', '_blank')} className="w-full mb-4">
          Create Your First Fragment
        </Button>
        <p className="text-sm text-gray-600">
          This will open in a new tab. Come back here when you're done!
        </p>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          I'll Create One Later <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function FeaturesStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const features = [
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find experiences by emotion, theme, or any text',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Heart,
      title: 'AI Connections',
      description: 'Discover how your experiences relate to each other',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: Shield,
      title: 'Privacy Controls',
      description: 'Full control over what you share and with whom',
      color: 'text-green-600 bg-green-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Explore What's Possible</h3>
        <p className="text-gray-700">
          Here are some key features that make LLHE special:
        </p>
      </div>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className={`p-3 rounded-full ${feature.color}`}>
              <feature.icon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          🎉 <strong>Pro tip:</strong> The more fragments you create, the better AI connections become!
        </p>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Finish Setup <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function CompleteStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">🎉</div>
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">You're All Set!</h3>
        <p className="text-lg text-gray-700">
          Welcome to your Living Library of Human Experiences. 
          Your journey of discovery starts now.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="secondary">Privacy Protected</Badge>
          <Badge variant="secondary">AI Powered</Badge>
          <Badge variant="secondary">Fully Searchable</Badge>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-2">What's Next?</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Create your first experience fragment</li>
          <li>• Explore the AI-generated connections</li>
          <li>• Invite friends to share their stories</li>
          <li>• Discover patterns in your experiences</li>
        </ul>
      </div>

      <Button onClick={onNext} className="w-full text-lg py-6">
        Enter Your Living Library
      </Button>
    </div>
  )
}
