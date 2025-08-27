import { useState, useMemo, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';
import { Check, X, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const initialChecklist = [
  { key: 'aps', label: 'APS Documents', completed: false, description: 'Collect and submit your APS documents for verification.' },
  { key: 'university_applications', label: 'University Applications', completed: false, description: 'Apply to your chosen universities and track your status.' },
  { key: 'ielts', label: 'Language Proficiency', completed: false, description: 'Achieve the required score on your language test (e.g., IELTS, TOEFL).' },
  { key: 'sop_cv', label: 'Documents (SOP/CV)', completed: false, description: 'Finalize your Statement of Purpose and CV.' },
  { key: 'blocked_account', label: 'Blocked Account', completed: false, description: 'Set up your blocked account to secure living expenses.' },
  { key: 'visa', label: 'Visa Process', completed: false, description: 'Gather necessary documents and apply for your student visa.' },
  { key: 'health_insurance', label: 'Health Insurance', completed: false, description: 'Secure a valid health insurance plan for your studies.' },
  { key: 'accommodation', label: 'Accommodation', completed: false, description: 'Find and book your housing before you arrive.' },
];

const Dashboard = () => {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [showTrophy, setShowTrophy] = useState(false);

  const handleToggle = (key) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const progress = useMemo(() => {
    const completedCount = checklist.filter((item) => item.completed).length;
    return Math.round((completedCount / checklist.length) * 100);
  }, [checklist]);

  // Show the trophy confetti animation when 100% complete
  useEffect(() => {
    if (progress === 100) {
      setShowTrophy(true);
      setTimeout(() => setShowTrophy(false), 5000); // Hide after 5 seconds
    }
  }, [progress]);

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 p-4 relative overflow-hidden">
        {showTrophy && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <Trophy className="w-48 h-48 text-yellow-400 drop-shadow-xl animate-pulse-slow" />
            <div className="absolute inset-0 confetti-container">
              {Array.from({ length: 50 }).map((_, i) => (
                <Sparkles key={i} className="confetti text-yellow-300 animate-fall" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, transform: `scale(${Math.random()})` }} />
              ))}
            </div>
          </motion.div>
        )}
        <motion.div
          className="w-full max-w-lg mx-auto relative z-20"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-3xl p-6 md:p-10 border-4 border-indigo-200">
            <CardHeader className="text-center p-0 mb-8">
              <CardTitle className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight leading-tight">
                Your Journey Dashboard 🚀
              </CardTitle>
              <p className="text-base text-gray-600 font-medium mt-2">
                Stay on top of your student application journey.
              </p>
            </CardHeader>
            <CardContent className="p-0 flex flex-col items-center gap-8">
              <div className="w-full flex flex-col items-center gap-4">
                <Progress value={progress} className="w-full h-8 rounded-full bg-indigo-100 border-2 border-indigo-300" />
                <span className="text-5xl font-black text-indigo-700 drop-shadow-md">
                  {progress}% Complete
                </span>
                <p className="text-sm text-gray-500 mt-2">
                  Keep going! You're making great progress.
                </p>
              </div>
              <motion.div
                className="w-full grid gap-4 mt-6"
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } },
                }}
              >
                {checklist.map((item) => (
                  <motion.div
                    key={item.key}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all shadow-sm",
                      item.completed ? "bg-green-100 border border-green-300" : "bg-white border border-gray-200 hover:bg-gray-50"
                    )}
                    variants={itemVariants}
                  >
                    <Checkbox
                      id={item.key}
                      checked={item.completed}
                      onCheckedChange={() => handleToggle(item.key)}
                      className={cn(
                        "h-6 w-6 rounded-lg transition-all",
                        item.completed ? "border-green-500 bg-green-500" : "border-gray-400"
                      )}
                    />
                    <label htmlFor={item.key} className="flex-1 cursor-pointer">
                      <span
                        className={cn(
                          "font-semibold text-lg",
                          item.completed ? "text-gray-500 line-through" : "text-gray-800"
                        )}
                      >
                        {item.label}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </p>
                    </label>
                    <motion.div
                      animate={{
                        rotate: item.completed ? [0, 360] : 0,
                        scale: item.completed ? [1, 1.2, 1] : 1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {item.completed ? (
                        <Check className="h-6 w-6 text-green-600" />
                      ) : (
                        <X className="h-6 w-6 text-gray-400" />
                      )}
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;