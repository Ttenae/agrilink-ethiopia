'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, Database } from 'lucide-react';

interface MarketPrice {
  id: string;
  commodity: string;
  market: string;
  price: number;
  unit: string;
  date: string;
  trend: number;
}

export default function MarketPage() {
  const { user } = useAuth();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [history, setHistory] = useState<MarketPrice[]>([]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/market/latest');
      setPrices(res.data);
    } catch (err) {
      toast.error('Failed to load market prices');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (commodity: string) => {
    try {
      const res = await api.get(`/market/history/${commodity}`);
      // Reverse to show newest first
      setHistory(res.data.reverse());
      setSelectedCommodity(commodity);
    } catch (err) {
      toast.error('Failed to load history');
    }
  };

  const seedData = async () => {
    setSeeding(true);
    try {
      await api.post('/market/scrape');
      toast.success('Market data updated successfully!');
      fetchPrices();
    } catch (err) {
      toast.error('Failed to update market data');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Market Prices</h1>
              <p className="text-gray-600">Latest Ethiopian commodity exchange rates</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={seedData} disabled={seeding || loading} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white">
                <Database className={`h-4 w-4 mr-2 ${seeding ? 'animate-pulse' : ''}`} />
                {seeding ? 'Updating...' : 'Update Data'}
              </Button>
              <Button onClick={fetchPrices} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Price Cards Grid */}
          {prices.length === 0 && !loading ? (
            <Card className="text-center py-12 bg-white border-dashed">
              <CardContent>
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No market data yet</h3>
                <p className="text-gray-500 mb-4">Click "Update Data" above to seed the database with market prices.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {prices.map((p) => (
                <Card 
                  key={p.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedCommodity === p.commodity ? 'ring-2 ring-green-500 bg-green-50/30' : ''
                  }`} 
                  onClick={() => fetchHistory(p.commodity)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{p.commodity}</h3>
                        <p className="text-sm text-gray-500">{p.market} • per {p.unit}</p>
                      </div>
                      <div className={`p-2 rounded-full ${p.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.trend >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-extrabold text-gray-900">
                        {p.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">ETB</span>
                      </p>
                      <p className={`text-sm font-medium mt-1 ${p.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {p.trend >= 0 ? '▲' : '▼'} {Math.abs(p.trend)}% (7d)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* History Section */}
          {selectedCommodity && (
            <Card className="border-0 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="border-b bg-white">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  {selectedCommodity} Price History
                </CardTitle>
                <CardDescription>Last 14 days of trading</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={h.id} className={`flex justify-between items-center p-4 hover:bg-gray-50 ${i !== history.length - 1 ? 'border-b' : ''}`}>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-500 w-24">
                          {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-sm text-gray-500">{h.market}</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {h.price.toLocaleString()} ETB <span className="text-xs font-normal text-gray-500">/ {h.unit}</span>
                      </span>
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
