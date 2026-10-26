'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Leaf,
  Pill,
  Shield,
  Info,
  Sparkles,
  History
} from 'lucide-react';

interface PredictionResult {
  disease: string;
  confidence: number;
  treatment: string;
  description: string;
  prevention: string;
  is_healthy: boolean;
  is_uncertain?: boolean;
  top_predictions?: Array<{ class: string; confidence: number }>;
  model_type?: string;
  model_confidence?: number;
  id?: string;
  timestamp?: string;
  image_analyzed?: string;
  detectionId?: string;
  createdAt?: string;
  imageUrl?: string;
}

export default function DiseaseDetectionPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<PredictionResult[]>([]);

  // ✅ PROTECT PAGE: Only allow Farmers
  useEffect(() => {
    if (user && user.role !== 'FARMER') {
      toast.error('AI Detection is only available for Farmers');
      window.location.href = '/dashboard';
    }
  }, [user]);

  if (user && user.role !== 'FARMER') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Redirecting to dashboard...</div>;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile); // ✅ Fixed: 'image' matches backend

      const response = await api.post('/ai/detect-disease', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Backend returns: { detectionId, disease, confidence, isHealthy, treatment, description, prevention, imageUrl, createdAt }
      const data = response.data;
      
      // Format for frontend display
      const formattedResult: PredictionResult = {
        disease: data.disease || 'Unknown',
        confidence: data.confidence || 0,
        treatment: data.treatment || 'N/A',
        description: data.description || 'No description available',
        prevention: data.prevention || 'No prevention information available',
        is_healthy: data.isHealthy || false,
        is_uncertain: data.confidence < 30,
        id: data.detectionId,
        timestamp: data.createdAt,
        image_analyzed: selectedFile.name,
        imageUrl: data.imageUrl,
        detectionId: data.detectionId,
        createdAt: data.createdAt,
      };

      setResult(formattedResult);
      
      // Add to history
      setHistory(prev => [formattedResult, ...prev].slice(0, 10));

      // Show appropriate toast
      if (formattedResult.is_uncertain) {
        toast.warning('⚠️ Uncertain result - please try a clearer image');
      } else if (formattedResult.is_healthy) {
        toast.success('✅ Plant appears healthy!');
      } else {
        toast.info(`🩺 Detected: ${formattedResult.disease}`);
      }
    } catch (error: any) {
      console.error('Detection error:', error);
      toast.error(error.response?.data?.message || 'Failed to detect disease');
    } finally {
      setLoading(false);
    }
  };

  const resetDetection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-100 text-green-700 border-green-200';
    if (confidence >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">AI Crop Disease Detection</h1>
            </div>
            <p className="text-gray-600">
              Upload a photo of a crop leaf and our AI will detect any diseases
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardContent className="p-6">
              {!previewUrl ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-green-500 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Drop your image here, or click to browse</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Supports JPG, JPEG, PNG (Max 10MB)
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={resetDetection}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleDetect}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Leaf className="h-4 w-4 mr-2" />
                          Detect Disease
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={resetDetection}
                      variant="outline"
                      className="flex-1"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      New Image
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <Card className="mb-6 border-0 shadow-lg">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <span>Detection Results</span>
                  {!result.is_uncertain && (
                    <Badge variant="outline" className={getConfidenceBadge(result.confidence)}>
                      {result.confidence.toFixed(1)}% confidence
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {result.image_analyzed && `Image: ${result.image_analyzed}`}
                  {result.timestamp && ` • ${new Date(result.timestamp).toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Disease Name */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Disease</h3>
                  <p className={`text-2xl font-bold ${
                    result.is_uncertain ? 'text-yellow-600' : 
                    result.is_healthy ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.is_uncertain ? '⚠️ Uncertain' : result.disease}
                  </p>
                  {!result.is_uncertain && (
                    <p className="text-sm text-gray-500 mt-1">
                      Confidence: <span className={getConfidenceColor(result.confidence)}>
                        {result.confidence.toFixed(1)}%
                      </span>
                    </p>
                  )}
                </div>

                {/* Uncertain Warning */}
                {result.is_uncertain && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-800 font-medium">
                          {result.disease}
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Confidence: {result.confidence.toFixed(1)}%
                        </p>
                        <p className="text-sm text-yellow-700 mt-2">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Healthy Status */}
                {!result.is_uncertain && (
                  <div className="flex items-center gap-2">
                    {result.is_healthy ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">✅ Plant appears healthy</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="text-red-700 font-medium">⚠️ Disease detected. See recommendations below.</span>
                      </>
                    )}
                  </div>
                )}

                {/* Description */}
                {!result.is_uncertain && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Description
                    </h3>
                    <p className="text-gray-700 mt-1">{result.description}</p>
                  </div>
                )}

                {/* Treatment */}
                {!result.is_uncertain && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Treatment
                    </h3>
                    <p className="text-gray-700 mt-1">{result.treatment}</p>
                  </div>
                )}

                {/* Prevention */}
                {!result.is_uncertain && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Prevention
                    </h3>
                    <p className="text-gray-700 mt-1">{result.prevention}</p>
                  </div>
                )}

                {/* Model Info */}
                <div className="text-xs text-gray-400 border-t pt-3">
                  <p>Model: EfficientNet-B0</p>
                  {result.detectionId && <p>Detection ID: {result.detectionId.slice(0, 8)}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Detections
                </CardTitle>
                <CardDescription>Your last {history.length} detections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        item.is_uncertain ? 'bg-yellow-50 border-yellow-200' :
                        item.is_healthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.is_uncertain ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : item.is_healthy ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {item.is_uncertain ? 'Uncertain' : item.disease}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">
                          {item.confidence.toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-400">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}