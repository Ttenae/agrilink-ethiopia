'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  ShoppingCart,
  Star,
  Edit,
  Save,
  X,
  Leaf,
  Store,
  Truck,
  Award,
  Calendar,
  Building,
  Ruler,
  CheckCircle2,
  AlertCircle,
  Camera,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string;
  avatarUrl?: string | null;
  farmerProfile?: {
    region: string;
    city: string;
    farmSize: number | null;
    description: string | null;
    verified: boolean;
  } | null;
  buyerProfile?: {
    companyName: string;
    location: string;
    description: string | null;
  } | null;
}

interface Stats {
  totalProducts?: number;
  totalOrders?: number;
  totalReviews?: number;
  averageRating?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth(); // ✅ Added updateUser here
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    region: '',
    city: '',
    farmSize: '',
    companyName: '',
    location: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // ✅ FIXED: Use /users/me so it doesn't fail for non-admins
      const response = await api.get(`/users/me`);
      const data = response.data;
      setProfile(data);

      // Populate form data
      setFormData({
        name: data.name || '',
        email: data.email || '',
        region: data.farmerProfile?.region || '',
        city: data.farmerProfile?.city || '',
        farmSize: data.farmerProfile?.farmSize?.toString() || '',
        companyName: data.buyerProfile?.companyName || '',
        location: data.buyerProfile?.location || '',
        description: data.farmerProfile?.description || data.buyerProfile?.description || '',
      });

      // Fetch stats
      await fetchStats(data.role, data.id);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (role: string, userId: string) => {
    try {
      const statsData: Stats = {};

      if (role === 'FARMER') {
        const productsRes = await api.get('/products/farmer');
        statsData.totalProducts = productsRes.data.length;

        const ordersRes = await api.get('/orders/farmer');
        statsData.totalOrders = ordersRes.data.length;

        const reviewsRes = await api.get(`/reviews/farmer/${userId}/rating`);
        statsData.totalReviews = reviewsRes.data.totalReviews || 0;
        statsData.averageRating = reviewsRes.data.averageRating || 0;
      } else if (role === 'BUYER') {
        const ordersRes = await api.get('/orders/buyer');
        statsData.totalOrders = ordersRes.data.length;

        const reviewsRes = await api.get('/reviews/buyer/me');
        statsData.totalReviews = reviewsRes.data.length;
      }

      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile picture updated!');
      
      // Update local page state
      setProfile(prev => prev ? { ...prev, avatarUrl: res.data.avatarUrl } : null);
      
      // ✅ Update global state (Header will refresh instantly)
      updateUser({ avatarUrl: res.data.avatarUrl }); 
    } catch (error) {
      toast.error('Failed to upload image. Max size is 5MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email || undefined,
      };

      if (profile?.role === 'FARMER') {
        updateData.farmerProfile = {
          region: formData.region,
          city: formData.city,
          farmSize: formData.farmSize ? parseFloat(formData.farmSize) : null,
          description: formData.description,
        };
      } else if (profile?.role === 'BUYER') {
        updateData.buyerProfile = {
          companyName: formData.companyName,
          location: formData.location,
          description: formData.description,
        };
      }

      await api.patch(`/users/profile`, updateData);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Profile Not Found</h1>
        <p className="text-gray-500">Unable to load your profile.</p>
        <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile</h1>
              <p className="text-gray-500">Manage your account settings</p>
            </div>
            {!editing && (
              <Button onClick={() => setEditing(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* User Info Card */}
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                
                {/* ✅ Avatar Section */}
                <div className="relative group flex-shrink-0">
                  {profile.avatarUrl ? (
                    <img 
                      src={`http://localhost:3005${profile.avatarUrl}`} 
                      alt="Profile" 
                      className="h-24 w-24 rounded-full object-cover border-4 border-green-50 shadow-sm"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                      <span className="text-4xl font-bold text-green-600">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-transform group-hover:scale-110 border border-gray-100"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin text-green-600" /> : <Camera className="h-4 w-4 text-gray-700" />}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload} 
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                    <Badge variant="outline" className="capitalize bg-gray-50">
                      {profile.role.toLowerCase()}
                    </Badge>
                    {profile.role === 'FARMER' && profile.farmerProfile?.verified && (
                      <Badge className="bg-green-600 text-white border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-3">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </span>
                    {profile.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        {profile.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {profile.role === 'FARMER' && (
              <>
                <StatCard icon={Package} title="Products" value={stats?.totalProducts || 0} color="blue" />
                <StatCard icon={ShoppingCart} title="Orders" value={stats?.totalOrders || 0} color="orange" />
                <StatCard icon={Star} title="Rating" value={stats?.averageRating ? `${stats.averageRating} ★` : 'No ratings'} color="amber" />
                <StatCard icon={Award} title="Reviews" value={stats?.totalReviews || 0} color="green" />
              </>
            )}
            {profile.role === 'BUYER' && (
              <>
                <StatCard icon={ShoppingCart} title="Orders" value={stats?.totalOrders || 0} color="blue" />
                <StatCard icon={Star} title="Reviews Written" value={stats?.totalReviews || 0} color="amber" />
              </>
            )}
          </div>

          {/* Edit Form */}
          {editing ? (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} />
                    </div>
                  </div>

                  {profile.role === 'FARMER' && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="region">Region</Label>
                          <Input id="region" name="region" placeholder="e.g., Oromia" value={formData.region} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input id="city" name="city" placeholder="e.g., Adama" value={formData.city} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="farmSize">Farm Size (hectares)</Label>
                          <Input id="farmSize" name="farmSize" type="number" placeholder="5" value={formData.farmSize} onChange={handleChange} />
                        </div>
                      </div>
                    </>
                  )}

                  {profile.role === 'BUYER' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input id="companyName" name="companyName" placeholder="Your company name" value={formData.companyName} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" placeholder="e.g., Addis Ababa" value={formData.location} onChange={handleChange} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      placeholder="Tell others about yourself or your business..."
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setEditing(false); fetchProfile(); }}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* Profile View */
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileRow icon={User} label="Name" value={profile.name} />
                <ProfileRow icon={Phone} label="Phone" value={profile.phone} />
                {profile.email && <ProfileRow icon={Mail} label="Email" value={profile.email} />}

                {profile.role === 'FARMER' && profile.farmerProfile && (
                  <>
                    <ProfileRow icon={MapPin} label="Region" value={profile.farmerProfile.region || 'Not set'} />
                    <ProfileRow icon={MapPin} label="City" value={profile.farmerProfile.city || 'Not set'} />
                    <ProfileRow icon={Ruler} label="Farm Size" value={profile.farmerProfile.farmSize ? `${profile.farmerProfile.farmSize} hectares` : 'Not set'} />
                    <ProfileRow icon={CheckCircle2} label="Verification Status" value={profile.farmerProfile.verified ? 'Verified' : 'Pending'} />
                  </>
                )}

                {profile.role === 'BUYER' && profile.buyerProfile && (
                  <>
                    <ProfileRow icon={Building} label="Company" value={profile.buyerProfile.companyName || 'Not set'} />
                    <ProfileRow icon={MapPin} label="Location" value={profile.buyerProfile.location || 'Not set'} />
                  </>
                )}

                {profile.farmerProfile?.description && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">{profile.farmerProfile.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

type StatColor = 'blue' | 'orange' | 'amber' | 'green';

const StatCard = ({ icon: Icon, title, value, color }: { 
  icon: any; 
  title: string; 
  value: string | number; 
  color: StatColor;
}) => {
  const colorClasses: Record<StatColor, string> = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
  };

  const colorClass = colorClasses[color];

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-full ${colorClass} flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProfileRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
    <Icon className="h-4 w-4 text-gray-400" />
    <span className="text-sm text-gray-500 min-w-[100px]">{label}</span>
    <span className="font-medium text-gray-900">{value || 'Not set'}</span>
  </div>
);