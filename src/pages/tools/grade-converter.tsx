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
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Grade & ECTS Converter</h1>
          <p className="text-muted-foreground mt-2">
            Convert between different German grading systems and calculate ECTS credits
          </p>
        </div>

        <Tabs defaultValue="bavarian" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bavarian">Bavarian Grade Calculator</TabsTrigger>
            <TabsTrigger value="ects">ECTS Converter</TabsTrigger>
          </TabsList>

          <TabsContent value="bavarian">
            <Card>
              <CardHeader>
                <CardTitle>Bavarian Grade Calculator</CardTitle>
                <CardDescription>
                  Convert German points (0-15) to Bavarian grades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 max-w-sm">
                  <div className="space-y-2">
                    <Label htmlFor="germanPoints">German Points (0-15)</Label>
                    <Input
                      id="germanPoints"
                      type="number"
                      min="0"
                      max="15"
                      step="1"
                      value={germanPoints}
                      onChange={handleGermanPointsChange}
                      placeholder="Enter points"
                    />
                  </div>
                  {germanPoints && (
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="font-medium">Result:</p>
                      <p className="text-2xl font-bold mt-1">{bavarianGrade}</p>
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Grading Scale:</p>
                  <ul className="space-y-1">
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
                <CardTitle>ECTS Credits Converter</CardTitle>
                <CardDescription>
                  Convert ECTS credits to workload hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 max-w-sm">
                  <div className="space-y-2">
                    <Label htmlFor="credits">ECTS Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="0"
                      step="0.5"
                      value={credits}
                      onChange={handleCreditsChange}
                      placeholder="Enter ECTS credits"
                    />
                  </div>
                  {credits && (
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="font-medium">Workload:</p>
                      <p className="text-2xl font-bold mt-1">{ectsResult}</p>
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">ECTS Information:</p>
                  <ul className="space-y-1">
                    <li>1 ECTS credit = 30 hours of work</li>
                    <li>Full academic year = 60 ECTS</li>
                    <li>Semester = 30 ECTS</li>
                    <li>Bachelor's degree = 180-240 ECTS</li>
                    <li>Master's degree = 60-120 ECTS</li>
                  </ul>
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