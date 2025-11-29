import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const { signIn, signUp, user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && role) {
      if (role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/my-complaints', { replace: true });
      }
    }
  }, [user, role, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pwd: string) => {
    const result = passwordSchema.safeParse(pwd);
    if (!result.success) {
      setPasswordErrors(result.error.errors.map(err => err.message));
      return false;
    }
    setPasswordErrors([]);
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword.length > 0) {
      validatePassword(newPassword);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(password)) {
      return;
    }
    
    setLoading(true);
    try {
      await signUp(email, password);
      // Auto sign in after signup (email confirmation is disabled)
      await signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-semibold">BroBox</CardTitle>
          <CardDescription>The Student Voice Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    required
                    className="w-full"
                  />
                  
                  {showPasswordRequirements && (
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-muted-foreground">Password must contain:</p>
                      <div className="space-y-1">
                        <PasswordRequirement 
                          met={password.length >= 8} 
                          text="At least 8 characters" 
                        />
                        <PasswordRequirement 
                          met={/[A-Z]/.test(password)} 
                          text="One uppercase letter" 
                        />
                        <PasswordRequirement 
                          met={/[a-z]/.test(password)} 
                          text="One lowercase letter" 
                        />
                        <PasswordRequirement 
                          met={/[0-9]/.test(password)} 
                          text="One number" 
                        />
                        <PasswordRequirement 
                          met={/[!@#$%^&*(),.?":{}|<>]/.test(password)} 
                          text="One special character (!@#$%^&*...)" 
                        />
                      </div>
                    </div>
                  )}
                  
                  {passwordErrors.length > 0 && !showPasswordRequirements && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription>
                        {passwordErrors[0]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading || passwordErrors.length > 0}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={met ? 'text-green-600' : 'text-muted-foreground'}>
        {text}
      </span>
    </div>
  );
}