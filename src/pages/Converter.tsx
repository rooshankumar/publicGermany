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
  const [maxMarks, setMaxMarks] = useState<string>('');
  const [minMarks, setMinMarks] = useState<string>('');
  const [yourMarks, setYourMarks] = useState<string>('');
  const [localCredits, setLocalCredits] = useState<string>('');
  const [germanGrade, setGermanGrade] = useState<number | null>(null);
  const [ectsCredits, setEctsCredits] = useState<number | null>(null);

  const calculateGrade = () => {
    const nMax = parseFloat(maxMarks);
    const nMin = parseFloat(minMarks);
    const nD = parseFloat(yourMarks);

    if (isNaN(nMax) || isNaN(nMin) || isNaN(nD)) {
      return;
    }

    if (nMax <= nMin || nD > nMax || nD < nMin) {
      alert('Please enter valid marks. Ensure Max > Min and Your Marks is between Min and Max.');
      return;
    }

    // Bavarian Formula: German Grade = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)
    const grade = 1 + (3 * (nMax - nD)) / (nMax - nMin);
    setGermanGrade(Math.round(grade * 100) / 100);

    // ECTS Conversion (default ratio: Local Credits × 2)
    if (localCredits && !isNaN(parseFloat(localCredits))) {
      setEctsCredits(parseFloat(localCredits) * 2);
    }
  };

  const reset = () => {
    setMaxMarks('');
    setMinMarks('');
    setYourMarks('');
    setLocalCredits('');
    setGermanGrade(null);
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
            <h1 className="text-4xl font-bold text-foreground mb-2">German Grade & ECTS Converter</h1>
            <p className="text-muted-foreground">Convert your academic grades using the Bavarian Formula</p>
          </div>

          <Card className="glass-morphism border-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Grade Calculator
              </CardTitle>
              <CardDescription>Enter your marks to calculate the German grade equivalent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxMarks">Maximum Marks (N<sub>max</sub>)</Label>
                  <Input
                    id="maxMarks"
                    type="number"
                    placeholder="e.g., 100"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minMarks">Min Passing Marks (N<sub>min</sub>)</Label>
                  <Input
                    id="minMarks"
                    type="number"
                    placeholder="e.g., 40"
                    value={minMarks}
                    onChange={(e) => setMinMarks(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yourMarks">Your Marks (N<sub>d</sub>)</Label>
                  <Input
                    id="yourMarks"
                    type="number"
                    placeholder="e.g., 85"
                    value={yourMarks}
                    onChange={(e) => setYourMarks(e.target.value)}
                  />
                </div>
              </div>

              {/* ECTS Section */}
              <div className="space-y-2">
                <Label htmlFor="localCredits">Local Credits (Optional)</Label>
                <Input
                  id="localCredits"
                  type="number"
                  placeholder="e.g., 120"
                  value={localCredits}
                  onChange={(e) => setLocalCredits(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">ECTS will be calculated as Local Credits × 2</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={calculateGrade} className="flex-1">
                  Calculate
                </Button>
                <Button onClick={reset} variant="outline">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <AnimatePresence>
            {germanGrade !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-morphism border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle>Your Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm">
                      <p className="text-sm text-muted-foreground mb-1">German Grade</p>
                      <p className="text-4xl font-bold text-primary">{germanGrade.toFixed(2)}</p>
                    </div>
                    {ectsCredits !== null && (
                      <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm">
                        <p className="text-sm text-muted-foreground mb-1">ECTS Credits</p>
                        <p className="text-3xl font-bold text-primary">{ectsCredits}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Card */}
          <Card className="glass-morphism border-glass mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About the Bavarian Formula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The Bavarian Formula is used to convert grades from different grading systems to the German grading scale (1.0 to 4.0).
              </p>
              <div className="p-3 rounded-md bg-muted/50 font-mono text-xs">
                German Grade = 1 + 3 × (N<sub>max</sub> - N<sub>d</sub>) / (N<sub>max</sub> - N<sub>min</sub>)
              </div>
              <div className="space-y-1">
                <p><strong>Where:</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  <li>N<sub>max</sub> = Maximum possible marks</li>
                  <li>N<sub>min</sub> = Minimum passing marks</li>
                  <li>N<sub>d</sub> = Your obtained marks</li>
                </ul>
              </div>
              <p className="text-xs italic">
                Note: This is an approximation. Always verify with your target university for exact conversion requirements.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Converter;
