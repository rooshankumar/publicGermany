import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, Search, GraduationCap } from "lucide-react";
import logos from '@/assets/logos.png';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
      }}></div>

      <div className="relative w-full max-w-lg">
        <Card className="shadow-medium border-border/50 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logos} alt="publicgermany Logo" className="h-12 w-12" />
              <span className="font-bold text-xl text-foreground">publicgermany</span>
            </div>
            <CardTitle className="text-6xl font-bold text-primary mb-2">404</CardTitle>
            <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Oops! The page you're looking for doesn't exist.
              </p>
              <p className="text-sm text-muted-foreground">
                You tried to access: <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="btn-primary">
                <Link to="/">
                  <Home className="mr-2 w-4 h-4" />
                  Back to Home
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  <GraduationCap className="mr-2 w-4 h-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Link 
                  to="/profile" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Profile Setup
                </Link>
                <Link 
                  to="/aps" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  APS Guidance
                </Link>
                <Link 
                  to="/applications" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Applications
                </Link>
                <Link 
                  to="/resources" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Resources
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;