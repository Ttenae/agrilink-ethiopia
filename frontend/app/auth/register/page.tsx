'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf, UserPlus, ArrowLeft, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'FARMER' as 'FARMER' | 'BUYER' | 'TRANSPORTER',
    region: '',
    city: '',
    farmSize: '',
    companyName: '',
    location: '',
    vehicleType: '',
    vehicleCapacity: '',
    licensePlate: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: 'FARMER' | 'BUYER' | 'TRANSPORTER') => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const baseData = {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      };

      let data: any;
      if (formData.role === 'FARMER') {
        data = { ...baseData, region: formData.region, city: formData.city, farmSize: formData.farmSize };
      } else if (formData.role === 'BUYER') {
        data = { ...baseData, companyName: formData.companyName, location: formData.location };
      } else if (formData.role === 'TRANSPORTER') {
        data = {
          ...baseData,
          vehicleType: formData.vehicleType,
          vehicleCapacity: formData.vehicleCapacity,
          licensePlate: formData.licensePlate,
          region: formData.region,
          city: formData.city,
          description: formData.description,
        };
      }

      await register(data);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join AgriLink and start growing your business</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" placeholder="0912345678" value={formData.phone} onChange={handleChange} required className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Min 6 characters" value={formData.password} onChange={handleChange} required className="h-11" />
            </div>

            <div className="space-y-2">
              <Label>I am a</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FARMER">Farmer</SelectItem>
                  <SelectItem value="BUYER">Buyer</SelectItem>
                  <SelectItem value="TRANSPORTER">Transporter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'FARMER' && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" name="region" placeholder="e.g., Oromia" value={formData.region} onChange={handleChange} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="e.g., Adama" value={formData.city} onChange={handleChange} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farmSize">Farm Size (hectares)</Label>
                  <Input id="farmSize" name="farmSize" type="number" placeholder="5" value={formData.farmSize} onChange={handleChange} className="h-11" />
                </div>
              </div>
            )}

            {formData.role === 'BUYER' && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" name="companyName" placeholder="Your company name" value={formData.companyName} onChange={handleChange} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="e.g., Addis Ababa" value={formData.location} onChange={handleChange} className="h-11" />
                </div>
              </div>
            )}

            {formData.role === 'TRANSPORTER' && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Input id="vehicleType" name="vehicleType" placeholder="e.g., Truck, Pickup, Bajaj" value={formData.vehicleType} onChange={handleChange} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleCapacity">Vehicle Capacity</Label>
                  <Input id="vehicleCapacity" name="vehicleCapacity" placeholder="e.g., 5 tons, 10 quintals" value={formData.vehicleCapacity} onChange={handleChange} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License Plate</Label>
                  <Input id="licensePlate" name="licensePlate" placeholder="e.g., AA-1234" value={formData.licensePlate} onChange={handleChange} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" name="region" placeholder="e.g., Oromia" value={formData.region} onChange={handleChange} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="e.g., Adama" value={formData.city} onChange={handleChange} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Tell about your transportation service..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90" disabled={loading}>
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}