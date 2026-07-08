import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Info, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import logos from '@/assets/logos.png';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Shield, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';

const Converter = () => {
  const { profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = !!profile;
  
  // German Grade Converter States
  const [maxMarks, setMaxMarks] = useState<string>('');
  const [minMarks, setMinMarks] = useState<string>('');
  const [yourMarks, setYourMarks] = useState<string>('');
  const [germanGrade, setGermanGrade] = useState<number | null>(null);

  // ECTS Converter States
  const [courseCredits, setCourseCredits] = useState<string>('');
  const [degreeYears, setDegreeYears] = useState<string>('');
  const [totalCredits, setTotalCredits] = useState<string>('');
  const [ectsCredits, setEctsCredits] = useState<number | null>(null);

  // Calculate German Grade (Modified Bavarian Formula by TUM)
  const calculateGermanGrade = (max: string, min: string, obtained: string) => {
    const nMax = parseFloat(max);
    const nMin = parseFloat(min);
    const nObtained = parseFloat(obtained);

    if (isNaN(nMax) || isNaN(nMin) || isNaN(nObtained)) {
      setGermanGrade(null);
      return;
    }

    if (nMax <= nMin || nObtained > nMax || nObtained < nMin) {
      setGermanGrade(null);
      return;
    }

    // Formula: 1 + (3 * (Max - Obtained)) / (Max - Pass)
    const grade = 1 + (3 * (nMax - nObtained)) / (nMax - nMin);
    setGermanGrade(Math.round(grade * 100) / 100);
  };

  // Calculate ECTS (TUM Formula)
  const calculateECTS = (cp: string, years: string, total: string) => {
    const courseCP = parseFloat(cp);
    const degreeYearsNum = parseFloat(years);
    const totalCreditsNum = parseFloat(total);

    if (isNaN(courseCP) || isNaN(degreeYearsNum) || isNaN(totalCreditsNum)) {
      setEctsCredits(null);
      return;
    }

    if (totalCreditsNum <= 0 || degreeYearsNum <= 0) {
      setEctsCredits(null);
      return;
    }

    // Formula: CP_course * (60 * years_of_degree) / total_credits_of_degree
    const ects = courseCP * (60 * degreeYearsNum) / totalCreditsNum;
    setEctsCredits(Math.round(ects * 100) / 100);
  };

  // Handle input changes with live calculation
  const handleMaxMarksChange = (value: string) => {
    setMaxMarks(value);
    calculateGermanGrade(value, minMarks, yourMarks);
  };

  const handleMinMarksChange = (value: string) => {
    setMinMarks(value);
    calculateGermanGrade(maxMarks, value, yourMarks);
  };

  const handleYourMarksChange = (value: string) => {
    setYourMarks(value);
    calculateGermanGrade(maxMarks, minMarks, value);
  };

  const handleCourseCreditsChange = (value: string) => {
    setCourseCredits(value);
    calculateECTS(value, degreeYears, totalCredits);
  };

  const handleDegreeYearsChange = (value: string) => {
    setDegreeYears(value);
    calculateECTS(courseCredits, value, totalCredits);
  };

  const handleTotalCreditsChange = (value: string) => {
    setTotalCredits(value);
    calculateECTS(courseCredits, degreeYears, value);
  };

  const resetGradeConverter = () => {
    setMaxMarks('');
    setMinMarks('');
    setYourMarks('');
    setGermanGrade(null);
  };

  const resetECTSConverter = () => {
    setCourseCredits('');
    setDegreeYears('');
    setTotalCredits('');
    setEctsCredits(null);
  };

  const converterContent = (
    <>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-lg font-bold text-foreground mb-1">German Grade & Credit Converter</h1>
          <p className="text-muted-foreground">Official TUM formulas for grade and credit conversion</p>
        </div>

        <Card className="glass-morphism border-glass mb-3"><CardContent className="p-2.5 space-y-2">
            <p className="text-[11px] font-semibold flex items-center gap-1.5"><Calculator className="h-3.5 w-3.5" /> German Grade Converter</p>
            <p className="text-[9px] text-muted-foreground">Modified Bavarian Formula (TUM)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="maxMarks">Maximum Grade at Your University</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  placeholder="e.g., 100"
                  value={maxMarks}
                  onChange={(e) => handleMaxMarksChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minMarks">Minimum Passing Grade</Label>
                <Input
                  id="minMarks"
                  type="number"
                  placeholder="e.g., 40"
                  value={minMarks}
                  onChange={(e) => handleMinMarksChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yourMarks">Your Obtained Grade</Label>
                <Input
                  id="yourMarks"
                  type="number"
                  placeholder="e.g., 85"
                  value={yourMarks}
                  onChange={(e) => handleYourMarksChange(e.target.value)}
                />
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground italic">Formula as per TUM – non-binding estimation.</p>
            <Button onClick={resetGradeConverter} variant="outline" size="sm" className="h-6 text-[9px]">Reset</Button>

            <AnimatePresence>
              {germanGrade !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="p-2 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <p className="text-[9px] text-muted-foreground mb-0.5">Your German Grade</p>
                  <p className="text-xl font-bold text-primary">{germanGrade.toFixed(2)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card className="glass-morphism border-glass mb-3"><CardContent className="p-2.5 space-y-2">
            <p className="text-[11px] font-semibold flex items-center gap-1.5"><Calculator className="h-3.5 w-3.5" /> Credit to ECTS Converter</p>
            <p className="text-[9px] text-muted-foreground">Convert Indian CP to ECTS (TUM Formula)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="courseCredits">Course Credit Points (CP)</Label>
                <Input
                  id="courseCredits"
                  type="number"
                  placeholder="e.g., 3"
                  value={courseCredits}
                  onChange={(e) => handleCourseCreditsChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degreeYears">Duration of Degree (Years)</Label>
                <Input
                  id="degreeYears"
                  type="number"
                  placeholder="e.g., 4"
                  value={degreeYears}
                  onChange={(e) => handleDegreeYearsChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCredits">Total Credits of Degree</Label>
                <Input
                  id="totalCredits"
                  type="number"
                  placeholder="e.g., 120"
                  value={totalCredits}
                  onChange={(e) => handleTotalCreditsChange(e.target.value)}
                />
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground italic">Formula as per TUM – non-binding estimation.</p>
            <Button onClick={resetECTSConverter} variant="outline" size="sm" className="h-6 text-[9px]">Reset</Button>

            <AnimatePresence>
              {ectsCredits !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="p-2 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <p className="text-[9px] text-muted-foreground mb-0.5">ECTS Equivalent</p>
                  <p className="text-xl font-bold text-primary">{ectsCredits.toFixed(2)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent></Card>

        <Card className="glass-morphism border-glass"><CardContent className="p-2.5 space-y-1.5">
            <p className="text-[11px] font-semibold flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> About the Formulas</p>
            <div className="text-[10px] text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">Modified Bavarian Formula</p>
              <div className="p-1.5 rounded bg-muted/50 font-mono text-[9px]">German Grade = 1 + 3 × (Max - Obtained) / (Max - Pass)</div>
              <p className="font-medium text-foreground">Credit to ECTS Formula (TUM)</p>
              <div className="p-1.5 rounded bg-muted/50 font-mono text-[9px]">ECTS = CP × (60 × Years) / Total Credits</div>
              <p className="text-[9px] italic pt-1 border-t">These are approximations per TUM guidelines. Always verify with your target university.</p>
            </div>
          </CardContent></Card>
      </motion.div>
    </>
  );

  // For editors, show within Layout with editor nav
  if (profile?.role === 'editor') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {converterContent}
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Different for authenticated vs public users */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm py-3 px-4 md:px-6">
        <div className="mx-auto w-full max-w-6xl flex items-center justify-between">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md overflow-hidden shrink-0">
              <img src={logos} alt="publicgermany logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col leading-tight">
              {!isAuthenticated && (
                <Badge className="inline-flex self-start mb-0.5 text-[10px] px-2 py-0 h-5">
                  <Shield className="w-3 h-3 mr-1" />
                  Trusted
                </Badge>
              )}
              <span className="font-bold text-lg text-foreground">publicgermany</span>
              <span className="text-xs text-muted-foreground">Grade Converter</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!isAuthenticated && (
            <div className="hidden lg:flex items-center gap-4">
              <Link to="/services" className="text-base font-medium text-foreground/90 hover:text-primary transition-colors">Services</Link>
              <Link to="/help" className="text-base font-medium text-foreground/90 hover:text-primary transition-colors">Help Center</Link>
              <Link to="/resources" className="text-base font-medium text-foreground/90 hover:text-primary transition-colors">Resources</Link>
              <Link to="/contact" className="text-base font-medium text-foreground/90 hover:text-primary transition-colors">Contact</Link>
              <ThemeToggle variant="icon" />
              <Button variant="outline" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild className="btn-cta">
                <Link to="/auth">Get Started Free</Link>
              </Button>
            </div>
          )}

          {/* Authenticated user - just theme toggle */}
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <ThemeToggle variant="icon" />
              <Button variant="outline" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button for public users */}
          {!isAuthenticated && (
            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle variant="icon" />
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-foreground hover:text-primary"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation for public users */}
        {!isAuthenticated && isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg">
            <div className="px-4 py-3 space-y-3">
              <Link to="/services" className="block text-base font-medium text-foreground hover:text-primary">Services</Link>
              <Link to="/help" className="block text-base font-medium text-foreground hover:text-primary">Help Center</Link>
              <Link to="/resources" className="block text-base font-medium text-foreground hover:text-primary">Resources</Link>
              <Link to="/contact" className="block text-base font-medium text-foreground hover:text-primary">Contact</Link>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="w-full btn-cta">
                  <Link to="/auth">Get Started Free</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {converterContent}
      </div>
    </div>
  );
};

export default Converter;
