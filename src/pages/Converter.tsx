import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import logos from '@/assets/logos.png';
import ThemeToggle from '@/components/ThemeToggle';

const Converter = () => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b glass-morphism py-3 px-4 md:px-6">
        <div className="mx-auto w-full max-w-6xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md overflow-hidden shrink-0">
              <img src={logos} alt="publicgermany logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg text-foreground">publicgermany</span>
              <span className="text-xs text-muted-foreground">Grade Converter</span>
            </div>
          </Link>
          <ThemeToggle variant="icon" />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">German Grade & Credit Converter</h1>
            <p className="text-muted-foreground">Official TUM formulas for grade and credit conversion</p>
          </div>

          <Card className="glass-morphism border-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                German Grade Converter
              </CardTitle>
              <CardDescription>Modified Bavarian Formula (TUM)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <p className="text-xs text-muted-foreground italic">
                Formula as per TUM (Technical University of Munich) – non-binding estimation.
              </p>

              <Button onClick={resetGradeConverter} variant="outline" size="sm">
                Reset
              </Button>

              {/* Results */}
              <AnimatePresence>
                {germanGrade !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <p className="text-sm text-muted-foreground mb-1">Your German Grade</p>
                    <p className="text-4xl font-bold text-primary">{germanGrade.toFixed(2)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Credit to ECTS Converter
              </CardTitle>
              <CardDescription>Convert Indian CP to ECTS (TUM Formula)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <p className="text-xs text-muted-foreground italic">
                Formula as per TUM (Technical University of Munich) – non-binding estimation.
              </p>

              <Button onClick={resetECTSConverter} variant="outline" size="sm">
                Reset
              </Button>

              {/* Results */}
              <AnimatePresence>
                {ectsCredits !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <p className="text-sm text-muted-foreground mb-1">ECTS Equivalent</p>
                    <p className="text-4xl font-bold text-primary">{ectsCredits.toFixed(2)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>


          {/* Info Card */}
          <Card className="glass-morphism border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About the Formulas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-2">Modified Bavarian Formula (German Grade)</p>
                <div className="p-3 rounded-md bg-muted/50 font-mono text-xs mb-2">
                  German Grade = 1 + 3 × (Max - Obtained) / (Max - Pass)
                </div>
                <p>Used to convert grades from different grading systems to the German grading scale (1.0 to 4.0).</p>
              </div>
              
              <div>
                <p className="font-medium text-foreground mb-2">Credit to ECTS Formula (TUM)</p>
                <div className="p-3 rounded-md bg-muted/50 font-mono text-xs mb-2">
                  ECTS = CP × (60 × Years) / Total Credits
                </div>
                <p>Used to convert Indian Credit Points to European Credit Transfer System (ECTS).</p>
              </div>

              <p className="text-xs italic pt-2 border-t border-border">
                Note: These are approximations as per TUM guidelines. Always verify with your target university for exact conversion requirements.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Converter;
