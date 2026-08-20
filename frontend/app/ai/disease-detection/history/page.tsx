'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../context/AuthContext';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { api } from '../../../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Leaf, 
  ArrowLeft, 
  Calendar, 
  Eye,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Detection {
  id: string;
  disease: string;
  confidence: number;
  isHealthy: boolean;
  createdAt: string;
  imageUrl: string;
  treatment?: string;
  description?: string;
}

export default function DetectionHistoryPage() {
  const { user } = useAuth();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai/history');
      setDetections(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load detection history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this detection?')) return;
    
    setDeleting(id);
    try {
      await api.delete(`/ai/history/${id}`);
      toast.success('Detection deleted');
      setDetections(detections.filter(d => d.id !== id));
    } catch (error) {
      toast.error('Failed to delete detection');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConfidenceColor = (value: number) => {
    if (value >= 80) return 'bg-green-100 text-green-700';
    if (value >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/ai/disease-detection">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <History className="h-8 w-8 text-primary" />
                Detection History
              </h1>
              <p className="text-muted-foreground">
                View all your past disease detection results
              </p>
            </div>
          </div>

          {detections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Detections Yet</h3>
                <p className="text-muted-foreground">
                  You haven't detected any diseases yet.
                </p>
                <Link href="/ai/disease-detection">
                  <Button className="mt-4">
                    Detect Disease
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {detections.map((detection) => (
                <Card key={detection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{detection.disease}</h3>
                          {detection.isHealthy ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Healthy
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Disease
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(detection.createdAt)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(detection.confidence)}`}>
                            {Math.round(detection.confidence)}% confidence
                          </span>
                        </div>
                        {detection.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {detection.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Link href={`/ai/disease-detection/result/${detection.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => handleDelete(detection.id)}
                          disabled={deleting === detection.id}
                        >
                          {deleting === detection.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}