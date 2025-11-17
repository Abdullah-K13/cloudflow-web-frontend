"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Cloud, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Header from "@/components/layout/Header";
import { login } from "@/lib/services/auth";

const Login = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const token = await login(formData.email, formData.password);

      // Verify token was stored
      if (typeof window !== "undefined") {
        const storedToken = localStorage.getItem("access_token");
        if (!storedToken && !token) {
          throw new Error("Failed to store authentication token. Please try again.");
        }
      }

      // Redirect to dashboard (root route)
      router.push("/");
    } catch (err: any) {
      // Extract error message
      let errorMessage = "Login failed";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err?.response?.data) {
        // Handle axios error response
        const data = err.response.data;
        errorMessage = data.detail || data.message || `Login failed (${err.response.status})`;
      }

      console.error("Login error:", err);
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-custom border-border">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cloud className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your CloudFlow account to continue building
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-smooth"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => handleInputChange("rememberMe", Boolean(checked))}
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-accent hover:text-accent-hover transition-smooth"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Error */}
                {errorMsg && (
                  <div className="text-sm text-red-600 border border-red-200 rounded-md p-2 bg-red-50">
                    {errorMsg}
                  </div>
                )}

                {/* Sign In Button */}
                <Button type="submit" className="w-full btn-primary" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
              </div>

              {/* Social Login Buttons (placeholders) */}
              <div className="space-y-3">
                <Button variant="outline" className="w-full" type="button">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <Button variant="outline" className="w-full" type="button">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M23.04 10.93c0-1.03-.09-2.02-.26-2.98H12v5.64h6.16c-.27 1.43-1.07 2.64-2.28 3.46v2.87h3.69c2.16-1.99 3.41-4.92 3.41-8.38l.06-.61z"/>
                    <path fill="currentColor" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.69-2.87c-1.07.72-2.44 1.15-4.24 1.15-3.26 0-6.02-2.2-7-5.16H1.18v2.96C3.13 21.3 7.36 24 12 24z"/>
                    <path fill="currentColor" d="M5 14.21c-.25-.72-.4-1.48-.4-2.21s.15-1.49.4-2.21V6.83H1.18C.43 8.33 0 10.12 0 12s.43 3.67 1.18 5.17L5 14.21z"/>
                    <path fill="currentColor" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.05 1.19 15.24 0 12 0 7.36 0 3.13 2.7 1.18 6.83L5 9.79c.98-2.96 3.74-5.16 7-5.16l-.04.12z"/>
                  </svg>
                  Continue with Microsoft
                </Button>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{" "}
                <Link href="/signup" className="text-accent hover:text-accent-hover transition-smooth font-medium">
                  Create one here
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
