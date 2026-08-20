'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  Loader2, 
  Leaf, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Image,
  Info,
  History
} from 'lucide-react';
import NextImage from 'next/image';  // ✅ Renamed to avoid conflict
import Link from 'next/link';
import { toast } from 'sonner';

export default function DiseaseDetectionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max size is 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
  };

  const handleDetect = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await api.post('/ai/detect-disease', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setResult(response.data);
      toast.success('Analysis complete!');
    } catch (error: any) {
      console.error('Detection failed:', error);
      const message = error.response?.data?.message || 'Failed to analyze image';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatConfidence = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const getConfidenceColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Leaf className="h-8 w-8 text-primary" />
                AI Crop Disease Detection
              </h1>
              <p className="text-muted-foreground">
                Upload a photo of your crop to detect diseases and get treatment recommendations
              </p>
            </div>
            <Link href="/ai/disease-detection/history">
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </Link>
          </div>

          <div className="grid gap-6">
            {!result ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Crop Photo</CardTitle>
                  <CardDescription>
                    Take a clear photo of the affected plant for best results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    {selectedImage ? (
                      <div className="relative w-full max-w-md mx-auto">
                        <NextImage
                          src={selectedImage}
                          alt="Selected crop"
                          width={400}
                          height={400}
                          className="rounded-lg object-cover w-full h-auto max-h-80"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleReset}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="w-full max-w-md aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground text-center">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports JPG, PNG, WebP (max 10MB)
                        </p>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {selectedImage && (
                      <Button
                        size="lg"
                        className="w-full max-w-md bg-primary hover:bg-primary/90"
                        onClick={handleDetect}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Detect Disease
                          </>
                        )}
                      </Button>
                    )}

                    {error && (
                      <div className="w-full max-w-md p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                        {error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Detection Results</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      New Detection
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedImage && (
                    <div className="flex justify-center">
                      <NextImage
                        src={selectedImage}
                        alt="Analyzed crop"
                        width={300}
                        height={300}
                        className="rounded-lg object-cover max-h-48"
                      />
                    </div>
                  )}

                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Disease</p>
                        <p className="text-2xl font-bold">{result.disease}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                          {formatConfidence(result.confidence)}
                        </p>
                      </div>
                    </div>

                    {result.isHealthy ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <p>✓ Plant appears healthy!</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                        <AlertTriangle className="h-5 w-5" />
                        <p>⚠️ Disease detected. See recommendations below.</p>
                      </div>
                    )}

                    {result.description && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-semibold">Description</p>
                        <p className="text-muted-foreground">{result.description}</p>
                      </div>
                    )}

                    {result.treatment && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-semibold text-green-800">💊 Treatment</p>
                        <p className="text-green-700">{result.treatment}</p>
                      </div>
                    )}

                    {result.prevention && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-semibold text-blue-800">🛡️ Prevention</p>
                        <p className="text-blue-700">{result.prevention}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}