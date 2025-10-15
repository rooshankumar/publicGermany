import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GradeConverter = () => {
  // Bavarian Grade Calculator
  const [germanPoints, setGermanPoints] = useState<string>('');
  const [bavarianGrade, setBavarianGrade] = useState<string>('');

  // ECTS Converter
  const [credits, setCredits] = useState<string>('');
  const [ectsResult, setEctsResult] = useState<string>('');

  const calculateBavarianGrade = (points: string) => {
    const numPoints = parseFloat(points);
    if (isNaN(numPoints) || numPoints < 0 || numPoints > 15) {
      return 'Invalid input';
    }

    // Bavarian grade calculation formula
    // 15-13 points = 1.0
    // 12-10 points = 2.0
    // 9-7 points = 3.0
    // 6-4 points = 4.0
    // 3-0 points = 5.0 (failed)
    
    let grade;
    if (numPoints >= 13) grade = '1.0';
    else if (numPoints >= 10) grade = '2.0';
    else if (numPoints >= 7) grade = '3.0';
    else if (numPoints >= 4) grade = '4.0';
    else grade = '5.0 (failed)';

    return grade;
  };

  const convertToECTS = (credits: string) => {
    const numCredits = parseFloat(credits);
    if (isNaN(numCredits) || numCredits < 0) {
      return 'Invalid input';
    }

    // Standard conversion: 1 ECTS = 30 hours of work
    const workHours = numCredits * 30;
    return `${workHours} hours of work`;
  };

  const handleGermanPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGermanPoints(value);
    setBavarianGrade(calculateBavarianGrade(value));
  };

  const handleCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCredits(value);
    setEctsResult(convertToECTS(value));
  };

  return (
    <Layout>
      <div className="container max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Grade & ECTS Converter</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Convert between German grading systems and calculate ECTS credits.
          </p>
        </div>

        <Tabs defaultValue="bavarian" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bavarian" className="text-sm">Bavarian Grade Calculator</TabsTrigger>
            <TabsTrigger value="ects" className="text-sm">ECTS Converter</TabsTrigger>
          </TabsList>

          <TabsContent value="bavarian">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bavarian Grade Calculator</CardTitle>
                <CardDescription className="text-sm">
                  Convert German points (0-15) to Bavarian grades.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 max-w-sm">
                  <div className="space-y-1">
                    <Label htmlFor="germanPoints" className="text-sm">German Points (0-15)</Label>
                    <Input
                      id="germanPoints"
                      type="number"
                      min="0"
                      max="15"
                      step="1"
                      value={germanPoints}
                      onChange={handleGermanPointsChange}
                      placeholder="Enter points"
                      className="text-sm"
                    />
                  </div>
                  {germanPoints && (
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="font-medium text-sm">Result:</p>
                      <p className="text-xl font-bold mt-1">{bavarianGrade}</p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Grading Scale:</p>
                  <ul className="space-y-0.5">
                    <li>15-13 points = 1.0 (Very Good)</li>
                    <li>12-10 points = 2.0 (Good)</li>
                    <li>9-7 points = 3.0 (Satisfactory)</li>
                    <li>6-4 points = 4.0 (Sufficient)</li>
                    <li>3-0 points = 5.0 (Failed)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ects">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ECTS Converter</CardTitle>
                <CardDescription className="text-sm">
                  Calculate the workload in hours based on ECTS credits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 max-w-sm">
                  <div className="space-y-1">
                    <Label htmlFor="credits" className="text-sm">ECTS Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="0"
                      step="1"
                      value={credits}
                      onChange={handleCreditsChange}
                      placeholder="Enter credits"
                      className="text-sm"
                    />
                  </div>
                  {credits && (
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="font-medium text-sm">Result:</p>
                      <p className="text-xl font-bold mt-1">{ectsResult}</p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Conversion Formula:</p>
                  <p>1 ECTS = 30 hours of work.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default GradeConverter;